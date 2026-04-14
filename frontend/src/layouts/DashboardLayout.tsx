import {
  BarChart3,
  CreditCard,
  LogOut,
  Megaphone,
  Package,
  Sandwich,
  Settings,
  Users,
} from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function DashboardLayout() {
  const { session, signOut } = useAuth();
  const restaurant = session?.restaurant;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-white/10 bg-white/5 p-5 lg:block">
          <Link
            to={`/${restaurant?.slug ?? ""}`}
            className="flex items-center gap-3 text-lg font-bold"
          >
            <Sandwich className="text-brand" />
            RL Burger SaaS
          </Link>

          <nav className="mt-8 space-y-2">
            <NavLink to="/admin" end className="dashboard-link">
              <BarChart3 size={18} />
              Visao geral
            </NavLink>

            <NavLink to="/admin/products" className="dashboard-link">
              <Package size={18} />
              Produtos
            </NavLink>

            <NavLink to="/admin/orders" className="dashboard-link">
              <Sandwich size={18} />
              Pedidos
            </NavLink>

            <NavLink to="/admin/customers" className="dashboard-link">
              <Users size={18} />
              Clientes
            </NavLink>

            <NavLink to="/admin/campaigns" className="dashboard-link">
              <Megaphone size={18} />
              Campanhas
            </NavLink>

            <NavLink to="/admin/settings" className="dashboard-link">
              <Settings size={18} />
              Configuracoes
            </NavLink>

            <NavLink to="/admin/billing" className="dashboard-link">
              <CreditCard size={18} />
              Billing
            </NavLink>
          </nav>

          <button
            onClick={signOut}
            className="mt-8 flex items-center gap-2 text-sm text-slate-400"
          >
            <LogOut size={16} />
            Sair
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
