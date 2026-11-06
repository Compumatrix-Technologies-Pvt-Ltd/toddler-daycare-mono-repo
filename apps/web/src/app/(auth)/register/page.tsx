import type { Metadata } from "next";
import { RegisterCard } from "../../../components/auth/RegisterCard";

export const metadata: Metadata = {
  title: "Profil erstellen | Kindertagespflege finden",
  description: "Erstelle ein Profil für Deine Kindertagespflege und biete Deine Plätze an.",
};

export default function RegisterPage() {
  return <RegisterCard />;
}
