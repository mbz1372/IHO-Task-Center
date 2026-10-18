import {redirect} from 'next/navigation';

// Historical operations dashboard is consolidated into the full Supply OS.
// Keep this URL as a safe legacy alias instead of offering two sources of truth.
export default function OperationsAlias(){redirect('/supply-os');}
