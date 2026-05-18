param(
  [string]$ConfigPath = ".github/project-board/modules-board.json",
  [string]$Repository,
  [string]$ProjectOwner,
  [string]$ProjectTitle,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Info {
  param([string]$Message)
  Write-Host "[info] $Message"
}

function Read-BoardConfig {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Board configuration file not found: $Path"
  }

  return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

function Test-GhAuthenticated {
  if ($DryRun) {
    return $true
  }

  & gh auth status 1>$null 2>$null
  return $LASTEXITCODE -eq 0
}

function Invoke-GhJson {
  param([string[]]$Arguments)

  $raw = & gh @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI command failed: gh $($Arguments -join ' ')"
  }

  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $null
  }

  return $raw | ConvertFrom-Json
}

function Invoke-GhVoid {
  param([string[]]$Arguments)

  & gh @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI command failed: gh $($Arguments -join ' ')"
  }
}

function Ensure-Label {
  param(
    [string]$Repo,
    [object]$Label
  )

  if ($DryRun) {
    Write-Info "Would ensure label '$($Label.name)'"
    return
  }

  Invoke-GhVoid @(
    "label", "create", $Label.name,
    "--repo", $Repo,
    "--color", $Label.color,
    "--description", $Label.description,
    "--force"
  )
}

function Get-ExactIssue {
  param(
    [string]$Repo,
    [string]$Title
  )

  if ($DryRun) {
    return $null
  }

  $issues = Invoke-GhJson @(
    "issue", "list",
    "--repo", $Repo,
    "--state", "all",
    "--search", "$Title in:title",
    "--json", "number,title,url"
  )

  return $issues | Where-Object { $_.title -eq $Title } | Select-Object -First 1
}

function Ensure-Project {
  param(
    [string]$Owner,
    [string]$Title
  )

  if ($DryRun) {
    Write-Info "Would ensure project '$Title' for '$Owner'"
    return [pscustomobject]@{ title = $Title }
  }

  $projects = Invoke-GhJson @(
    "project", "list",
    "--owner", $Owner,
    "--limit", "100",
    "--format", "json"
  )

  $existing = $projects.projects | Where-Object { $_.title -eq $Title } | Select-Object -First 1
  if ($existing) {
    Write-Info "Using existing project '$Title'"
    return $existing
  }

  Write-Info "Creating project '$Title'"
  return Invoke-GhJson @(
    "project", "create",
    "--owner", $Owner,
    "--title", $Title,
    "--format", "json"
  )
}

function Build-ChildIssueBody {
  param([object]$Issue)

  $lines = @(
    "## Scope",
    "This issue belongs to the module board backlog and should be executed as a focused delivery task.",
    "",
    "## Deliverables"
  )

  foreach ($item in $Issue.deliverables) {
    $lines += "- [ ] $item"
  }

  $lines += ""
  $lines += "## Acceptance Criteria"

  foreach ($criterion in $Issue.acceptance) {
    $lines += "- $criterion"
  }

  $lines += ""
  $lines += "## Notes"
  $lines += "- Respect the monorepo architecture: backend as source of truth, frontend as consumer, shared packages as contract."
  $lines += "- Keep the implementation scoped to this issue unless a dependent change is required."

  return ($lines -join "`n")
}

function Build-ParentIssueBody {
  param(
    [object]$Module,
    [object[]]$Children
  )

  $lines = @(
    "## Objective",
    $Module.summary,
    "",
    "## Child Issues"
  )

  foreach ($child in $Children) {
    $lines += "- [ ] #$($child.number) $($child.title)"
  }

  $lines += ""
  $lines += "## Definition of Done"
  $lines += "- Module work respects controller-service-repository boundaries"
  $lines += "- Frontend consumes backend contracts without duplicating business rules"
  $lines += "- Shared DTOs and types remain the single source of truth"
  $lines += "- Validation, manual checks, and regression review are documented"

  return ($lines -join "`n")
}

function New-OrReuseIssue {
  param(
    [string]$Repo,
    [string]$Project,
    [string]$Title,
    [string]$Body,
    [string[]]$Labels
  )

  $existing = Get-ExactIssue -Repo $Repo -Title $Title
  if ($existing) {
    Write-Info "Reusing existing issue '$Title' (#$($existing.number))"
    return $existing
  }

  if ($DryRun) {
    Write-Info "Would create issue '$Title'"
    return [pscustomobject]@{
      number = 0
      title = $Title
      url = "dry-run://$($Title -replace ' ', '-')"
    }
  }

  $args = @(
    "issue", "create",
    "--repo", $Repo,
    "--title", $Title,
    "--body", $Body,
    "--project", $Project
  )

  foreach ($label in $Labels) {
    $args += @("--label", $label)
  }

  $url = (& gh @args).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create issue '$Title'"
  }

  $issue = Get-ExactIssue -Repo $Repo -Title $Title
  if ($issue) {
    return $issue
  }

  return [pscustomobject]@{
    number = "unknown"
    title = $Title
    url = $url
  }
}

$config = Read-BoardConfig -Path $ConfigPath

if (-not $Repository) {
  $Repository = $config.repository
}

if (-not $ProjectOwner) {
  $ProjectOwner = $config.projectOwner
}

if (-not $ProjectTitle) {
  $ProjectTitle = $config.projectTitle
}

if (-not (Test-GhAuthenticated)) {
  throw "GitHub CLI is not authenticated. Run 'gh auth login' and then 'gh auth refresh -s project' before executing this script."
}

Write-Info "Repository: $Repository"
Write-Info "Project owner: $ProjectOwner"
Write-Info "Project title: $ProjectTitle"
Write-Info "Dry run: $DryRun"

foreach ($label in $config.labels) {
  Ensure-Label -Repo $Repository -Label $label
}

foreach ($module in $config.modules) {
  Ensure-Label -Repo $Repository -Label ([pscustomobject]@{
    name = $module.label
    color = "BFDADC"
    description = "Issues for the $($module.key) module"
  })
}

$project = Ensure-Project -Owner $ProjectOwner -Title $ProjectTitle

foreach ($module in $config.modules) {
  Write-Info "Processing module '$($module.key)'"
  $children = @()

  foreach ($subIssue in $module.subIssues) {
    $childLabels = @("type:task", $module.label) + $subIssue.areas
    $childBody = Build-ChildIssueBody -Issue $subIssue
    $children += New-OrReuseIssue -Repo $Repository -Project $ProjectTitle -Title $subIssue.title -Body $childBody -Labels $childLabels
  }

  $parentBody = Build-ParentIssueBody -Module $module -Children $children
  $parentLabels = @("type:epic", $module.label)
  [void](New-OrReuseIssue -Repo $Repository -Project $ProjectTitle -Title $module.title -Body $parentBody -Labels $parentLabels)
}

Write-Info "Board generation flow completed."
if ($DryRun) {
  Write-Info "Dry run finished without writing to GitHub."
}
