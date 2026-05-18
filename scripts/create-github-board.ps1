param(
  [string]$ConfigPath = ".github/project-board/modules-board.json",
  [string]$Repository,
  [string]$ProjectOwner,
  [string]$ProjectTitle,
  [switch]$DryRun,
  [switch]$SkipProject
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
    "--json", "number,title,url,labels"
  )

  return $issues | Where-Object { $_.title -eq $Title } | Select-Object -First 1
}

function Ensure-Project {
  param(
    [string]$Owner,
    [string]$Title
  )

  if ($SkipProject) {
    Write-Info "Skipping project lookup and project item creation."
    return $null
  }

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
  param(
    [object]$Issue,
    [object]$Epic,
    [object]$Stream
  )

  $lines = @(
    "## Context",
    $Epic.summary,
    "",
    "## Roadmap Placement",
    "- Stream: $($Stream.title)",
    "- Priority horizon: $($Epic.horizonLabel)",
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

  if ($Epic.dependencies.Count -gt 0) {
    $lines += ""
    $lines += "## Dependencies"
    foreach ($dependency in $Epic.dependencies) {
      $lines += "- $dependency"
    }
  }

  $lines += ""
  $lines += "## Notes"
  $lines += "- Backend remains the source of truth."
  $lines += "- Frontend consumes backend APIs and shared contracts only."
  $lines += "- Keep the implementation scoped unless a clearly justified dependent change is required."

  return ($lines -join "`n")
}

function Build-ParentIssueBody {
  param(
    [object]$Stream,
    [object]$Epic,
    [object[]]$Children
  )

  $lines = @(
    "## Objective",
    $Epic.summary,
    "",
    "## Board Organization",
    "- Stream: $($Stream.title)",
    "- Priority horizon: $($Epic.horizonLabel)",
    "",
    "## Dependencies"
  )

  foreach ($dependency in $Epic.dependencies) {
    $lines += "- $dependency"
  }

  $lines += ""
  $lines += "## Sub-Issues"

  foreach ($child in $Children) {
    $lines += "- [ ] #$($child.number) $($child.title)"
  }

  $lines += ""
  $lines += "## Exit Criteria"

  foreach ($criterion in $Epic.exitCriteria) {
    $lines += "- $criterion"
  }

  $lines += ""
  $lines += "## Governance"
  $lines += "- Respect controller -> service -> repository boundaries."
  $lines += "- Keep frontend business logic thin and contract-driven."
  $lines += "- Document validation and regressions before closing the epic."

  return ($lines -join "`n")
}

function Ensure-Issue {
  param(
    [string]$Repo,
    [string]$ProjectName,
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
    "--body", $Body
  )

  foreach ($label in $Labels) {
    $args += @("--label", $label)
  }

  if (-not $SkipProject -and -not [string]::IsNullOrWhiteSpace($ProjectName)) {
    $args += @("--project", $ProjectName)
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
  throw "GitHub CLI is not authenticated. Run 'gh auth login' before executing this script."
}

Write-Info "Repository: $Repository"
Write-Info "Project owner: $ProjectOwner"
Write-Info "Project title: $ProjectTitle"
Write-Info "Dry run: $DryRun"
Write-Info "Skip project: $SkipProject"

foreach ($label in $config.labels) {
  Ensure-Label -Repo $Repository -Label $label
}

$project = Ensure-Project -Owner $ProjectOwner -Title $ProjectTitle
$projectName = if ($null -ne $project) { $ProjectTitle } else { $null }

foreach ($stream in $config.streams) {
  Write-Info "Processing stream '$($stream.key)'"

  foreach ($epic in $stream.epics) {
    Write-Info "Processing epic '$($epic.key)'"
    $children = @()

    foreach ($subIssue in $epic.subIssues) {
      $childLabels = @("type:task", $stream.streamLabel, $epic.horizonLabel) + $subIssue.labels
      $childBody = Build-ChildIssueBody -Issue $subIssue -Epic $epic -Stream $stream
      $children += Ensure-Issue -Repo $Repository -ProjectName $projectName -Title $subIssue.title -Body $childBody -Labels $childLabels
    }

    $parentLabels = @("type:epic", $stream.streamLabel, $epic.horizonLabel) + $epic.moduleLabels
    $parentBody = Build-ParentIssueBody -Stream $stream -Epic $epic -Children $children
    [void](Ensure-Issue -Repo $Repository -ProjectName $projectName -Title $epic.title -Body $parentBody -Labels $parentLabels)
  }
}

Write-Info "Board generation flow completed."

if ($SkipProject) {
  Write-Info "Issues and labels were created without project-board linking."
  Write-Info "To sync them into the GitHub project later, refresh gh scopes with read:project/project and rerun without -SkipProject."
}

if ($DryRun) {
  Write-Info "Dry run finished without writing to GitHub."
}
