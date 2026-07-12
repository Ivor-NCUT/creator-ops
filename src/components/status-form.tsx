import type { ComponentProps } from "react";

export function StatusForm({ action, id, returnTo, options }: { action: ComponentProps<"form">["action"]; id: string; returnTo: string; options: readonly string[] }) {
  if (options.length === 0) return null;
  return <form action={action} className="status-form">
    <input name="id" type="hidden" value={id} />
    <input name="returnTo" type="hidden" value={returnTo} />
    <label><span className="sr-only">下一状态</span><select name="status" required>{options.map((status) => <option key={status}>{status}</option>)}</select></label>
    <button className="button-secondary" type="submit">流转</button>
  </form>;
}
