import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { SearchInput, FilterBar } from "../components/ui/FilterBar";
import { CustomerCard } from "../components/customers/CustomerCard";
import { customers } from "../mock/generator";
import { Card } from "../components/ui/Card";

export function Customers() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell pageTitle="Customers">
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customers"
        />
      </FilterBar>

      {customers.length === 0 ? (
        <Card className="flex min-h-[320px] items-center justify-center">
          <div className="max-w-md px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-blue-50)]">
              <span className="text-lg text-[var(--color-blue-600)]">
                👥
              </span>
            </div>

            <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
              No customers yet
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-500)]">
              Customers will appear here once customer communications are
              tracked in SpikeOS.
            </p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-[240px] items-center justify-center">
          <div className="px-6 py-10 text-center">
            <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
              No customers found
            </h2>

            <p className="mt-2 text-sm text-[var(--color-ink-500)]">
              Try changing your search.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => navigate(`/customers/${customer.id}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}