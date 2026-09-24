import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { SearchInput, FilterBar } from "../components/ui/FilterBar";
import { CustomerCard } from "../components/customers/CustomerCard";
import { customers } from "../mock/generator";

export function Customers() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell pageTitle="Customers">
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers" />
      </FilterBar>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CustomerCard key={c.id} customer={c} onClick={() => navigate(`/customers/${c.id}`)} />
        ))}
      </div>
    </AppShell>
  );
}
