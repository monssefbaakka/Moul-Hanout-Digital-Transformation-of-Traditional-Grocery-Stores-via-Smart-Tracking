import { redirect } from 'next/navigation';

/**
 * /register is intentionally disabled.
 * New users are added directly by the owner from the dashboard.
 * This page permanently redirects to /login to avoid 404s from old links.
 */
export default function RegisterPage() {
  redirect('/login');
}
