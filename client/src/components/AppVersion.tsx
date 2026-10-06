import { version } from "../../package.json";

export function AppVersion() {
  return <p className="text-center text-xs font-medium text-brand-500">Version {version}</p>;
}
