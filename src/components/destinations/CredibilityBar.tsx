interface CredibilityBarProps {
  lastVerifiedAt?: string | null;
}

export default function CredibilityBar({ lastVerifiedAt }: CredibilityBarProps) {
  const verifiedDate = lastVerifiedAt
    ? new Date(lastVerifiedAt).toLocaleDateString("es-MX", { year: "numeric", month: "long" })
    : null;

  return (
    <div className="border-t border-border pt-6 mt-2 space-y-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground/70">Nomaderia</span>
        {" "}— concierge de aventura outdoor en español para hispanos en EE.{" "}UU.
        {" "}Guías honestas con enfoque en principiantes, revisadas por nuestro equipo.
      </p>
      <p className="text-xs text-muted-foreground/60">
        Fuentes: NPS (nps.gov) · Recreation.gov
        {verifiedDate && <> · Última verificación: {verifiedDate}</>}
      </p>
    </div>
  );
}
