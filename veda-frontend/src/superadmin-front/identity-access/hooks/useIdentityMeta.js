import { useEffect, useState } from "react";
import { superadminIdentityAPI } from "../../../services/superadminIdentityAPI";
export default function useIdentityMeta() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminIdentityAPI
      .getMeta()
      .then((res) => setMeta(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { meta, loading, defaultSchool: meta?.schools?.[0] || "" };
}
