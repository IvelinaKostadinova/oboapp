import React from "react";

interface DetailItemProps {
  title: string;
  children: React.ReactNode;
}

export default function DetailItem({ title, children }: DetailItemProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
