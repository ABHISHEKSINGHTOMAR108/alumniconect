import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "Alumni Directory — AlumniConnect" },
      { name: "description", content: "Search alumni by name, batch, branch and company." },
      { property: "og:title", content: "Alumni Directory — AlumniConnect" },
      { property: "og:description", content: "Search alumni by name, batch, branch and company." },
    ],
  }),
  component: Directory;
});

function Directory() {
  return null;
}
