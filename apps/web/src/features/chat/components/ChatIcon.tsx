export type IconName =
  | "menu"
  | "sparkle"
  | "plus"
  | "message"
  | "edit"
  | "trash"
  | "more"
  | "chevron"
  | "send"
  | "stop"
  | "close";

export const ChatIcon = ({
  name,
  className = "size-4",
}: {
  name: IconName;
  className?: string;
}) => {
  const paths: Record<IconName, string> = {
    menu: "M4 6h16M4 12h16M4 18h16",
    sparkle:
      "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",
    plus: "M12 5v14M5 12h14",
    message:
      "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
    edit: "m12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z",
    trash: "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6",
    more: "M12 5h.01M12 12h.01M12 19h.01",
    chevron: "m7 10 5 5 5-5",
    send: "m22 2-7 20-4-9-9-4Zm0 0L11 13",
    stop: "M7 7h10v10H7z",
    close: "m18 6-12 12M6 6l12 12",
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
};
