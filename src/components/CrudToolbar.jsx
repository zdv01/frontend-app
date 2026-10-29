import { Search } from 'lucide-react'

/*
 * Barra superior del patrón CRUD: buscador + filtro de estado + lo que se pase en children
 * (otros filtros y el botón verde "+ Nuevo ...").
 */
export function CrudToolbar({ search, onSearchChange, searchPlaceholder, status, onStatusChange, children }) {
  return (
    <div className="crud-toolbar">
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </label>
      {onStatusChange && (
        <select
          className="input select-filter"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      )}
      <div className="crud-toolbar-actions">{children}</div>
    </div>
  )
}
