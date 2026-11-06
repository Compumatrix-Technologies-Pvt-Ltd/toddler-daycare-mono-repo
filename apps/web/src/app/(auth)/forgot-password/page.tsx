import type { Metadata } from "next";
import { ForgotPasswordCard } from "../../../components/auth/ForgotPasswordCard";

export const metadata: Metadata = {
  title: "Passwort vergessen | Kindertagespflege finden",
  description: "Setze Dein Passwort für Dein Betreuungs-Dashboard zurück.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />
}
