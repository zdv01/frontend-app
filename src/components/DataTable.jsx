import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalizeText } from '../utils/format'
import { Spinner } from './Spinner'

/*
 * Tabla reutilizable con orden por columnas y paginación.
 *
 * columns: [{ key, label, sortable, render(row), sortValue(row), className }]
 * rows:    arreglo de objetos (cada uno con un "id")
 * onRowClick(row) y selectedId: para resaltar la fila seleccionada
 */
export function DataTable({
  columns,
  rows,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No hay registros para mostrar.',
  onRowClick,
  selectedId,
  pageSize = 8,
}) {
  const [sort, setSort] = useState(null) // { key, direction: 'asc' | 'desc' }
  const [page, setPage] = useState(1)

  const sortedRows = useMemo(() => {
    const list = rows ?? []
    if (!sort) return list
    const column = columns.find((c) => c.key === sort.key)
    const valueOf = (row) => (column?.sortValue ? column.sortValue(row) : row[sort.key])
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const va = valueOf(a)
      const vb = valueOf(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
      return normalizeText(va ?? '').localeCompare(normalizeText(vb ?? '')) * factor
    })
  }, [rows, sort, columns])

  const total = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageRows = sortedRows.slice(start, start + pageSize)

  const toggleSort = (key) => {
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }

  const renderBody = () => {
    if (loading && !rows) {
      return (
        <tr>
          <td colSpan={columns.length} className="table-message">
            <Spinner label="Cargando..." />
          </td>
        </tr>
      )
    }
    if (error) {
      return (
        <tr>
          <td colSpan={columns.length} className="table-message table-error">
            No se pudieron cargar los datos.
            {onRetry && (
              <button type="button" className="btn" onClick={onRetry}>
                Reintentar
              </button>
            )}
          </td>
        </tr>
      )
    }
    if (total === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="table-message">
            {emptyMessage}
          </td>
        </tr>
      )
    }
    return pageRows.map((row) => (
      <tr
        key={row.id}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={`${onRowClick ? 'row-clickable' : ''} ${row.id === selectedId ? 'row-selected' : ''}`}
      >
        {columns.map((column) => (
          <td key={column.key} className={column.className}>
            {column.render ? column.render(row) : row[column.key]}
          </td>
        ))}
      </tr>
    ))
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key
                const SortIcon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
                return (
                  <th
                    key={column.key}
                    className={column.className}
                    aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {column.sortable ? (
                      <button type="button" className="th-sort" onClick={() => toggleSort(column.key)}>
                        {column.label}
                        <SortIcon size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>

      {total > 0 && !error && (
        <footer className="table-footer">
          <span className="text-muted">
            Mostrando {start + 1} a {start + pageRows.length} de {total}
          </span>
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Paginación">
              <button
                type="button"
                className="btn btn-page"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  className={`btn btn-page ${number === currentPage ? 'btn-page-active' : ''}`}
                  onClick={() => setPage(number)}
                  aria-current={number === currentPage ? 'page' : undefined}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-page"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </footer>
      )}
    </div>
  )
}
