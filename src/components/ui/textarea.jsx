import * as React from "react";

export const Textarea = React.forwardRef(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={
          "flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm " +
          "text-slate-900 placeholder:text-slate-400 ring-offset-white " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          className
        }
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
