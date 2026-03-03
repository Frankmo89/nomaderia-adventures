import { Helmet } from "react-helmet-async";

interface JsonLdProps {
  data: Record<string, unknown>;
}

const JsonLd = ({ data }: JsonLdProps) => (
  <Helmet>
    <script type="application/ld+json" data-jsonld="true">{JSON.stringify(data)}</script>
  </Helmet>
);

export default JsonLd;
