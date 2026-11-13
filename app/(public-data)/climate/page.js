import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace.js";
import ClimateObservationDetails from "@/components/climate/ClimateObservationDetails.js";

export default function ClimatePage() {
  return <DashboardWorkspace view="climate"><ClimateObservationDetails /></DashboardWorkspace>;
}
