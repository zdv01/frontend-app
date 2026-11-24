import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { matchesSearch } from '../../../utils/format'
import { PersonCell } from './gdUi'
import './gd.css'

// Combobox de jugadores: un solo campo que filtra por nombre o documento (sin tildes).
// value = id seleccionado ('' si no hay); onChange recibe el id (o '' al limpiar).
export function JugadorCombobox({ id, jugadores, value, onChange, excluirIds = [], error }) {
  const seleccionado = jugadores.find((j) => String(j.id) === String(value))
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [resaltado, setResaltado] = useState(0)
  const raiz = useRef(null)
  const listaRef = useRef(null)

  // Con selección se muestra su nombre; si no, lo que escribe el usuario
  const mostrado = seleccionado ? seleccionado.nombreCompleto : texto
  const opciones = useMemo(
    () => jugadores.filter((j) => matchesSearch(texto, j.nombreCompleto, j.numeroDocumento)),
    [jugadores, texto],
  )

  // Cierra la lista al hacer clic fuera
  useEffect(() => {
    const fuera = (event) => { if (raiz.current && !raiz.current.contains(event.target)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  // Mantiene visible la opción resaltada al navegar con flechas
  useEffect(() => {
    if (!abierto) return
    listaRef.current?.children[resaltado]?.scrollIntoView?.({ block: 'nearest' })
  }, [resaltado, abierto])

  const escribir = (event) => {
    setTexto(event.target.value)
    setResaltado(0)
    setAbierto(true)
    if (value !== '') onChange('') // al volver a escribir se limpia la selección
  }

  const elegir = (jugador) => {
    onChange(String(jugador.id))
    setTexto('')
    setAbierto(false)
  }

  const teclado = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setAbierto(true)
      setResaltado((i) => Math.min(i + 1, Math.max(opciones.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setResaltado((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && abierto) {
      event.preventDefault()
      if (opciones[resaltado]) elegir(opciones[resaltado])
    } else if (event.key === 'Escape' && abierto) {
      event.stopPropagation() // no cierra el modal, solo la lista
      setAbierto(false)
    }
  }

  const listaId = `${id}-lista`
  return (
    <div className="gd-combo" ref={raiz}>
      <div className="gd-combo-field">
        <Search size={16} aria-hidden="true" className="gd-combo-icon" />
        <input
          id={id}
          className={`input gd-combo-input${error ? ' is-invalid' : ''}`}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={abierto && opciones[resaltado] ? `${id}-op-${opciones[resaltado].id}` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          placeholder="Buscar y seleccionar jugador..."
          value={mostrado}
          onChange={escribir}
          onFocus={() => setAbierto(true)}
          onKeyDown={teclado}
        />
      </div>
      {abierto && (
        <ul id={listaId} className="gd-combo-list" role="listbox" ref={listaRef}>
          {opciones.map((j, i) => {
            const yaEsta = excluirIds.includes(j.id)
            return (
              <li
                key={j.id}
                id={`${id}-op-${j.id}`}
                role="option"
                aria-selected={String(j.id) === String(value)}
                className={`gd-combo-option${i === resaltado ? ' is-active' : ''}`}
                onMouseEnter={() => setResaltado(i)}
                onMouseDown={(event) => { event.preventDefault(); elegir(j) }}
              >
                <PersonCell name={j.nombreCompleto} subtitle={j.numeroDocumento} size={28} />
                {yaEsta && <span className="gd-combo-tag">En plantilla</span>}
              </li>
            )
          })}
          {opciones.length === 0 && <li className="gd-combo-empty" role="option" aria-disabled="true" aria-selected="false">Sin resultados</li>}
        </ul>
      )}
    </div>
  )
}
