import { PropsWithChildren } from "react";

export function Table({ children }: PropsWithChildren) {
  return <table className="w-full border-collapse text-sm">{children}</table>;
}
