// Alternative server-side redirect approach
// To use this, rename this file to page.js and replace the current page.js

import { redirect } from 'next/navigation'

export default function AdminRedirect() {
  // Server-side redirect - more efficient
  redirect('http://localhost:3000')
}
