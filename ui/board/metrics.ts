namespace $ {

	export type $trip2gtasks_board_metric = {
		flag: string
		label: string
		count: number
		risk: boolean
	}

	const defaults = [
		{ flag: 'active', label: '', risk: false },
		{ flag: 'overdue', label: '', risk: true },
		{ flag: 'blocked', label: '', risk: true },
	]

	export function $trip2gtasks_board_metrics(defs: unknown, cards: { flags?: Record<string, boolean> }[]): $trip2gtasks_board_metric[] {
		const given = Array.isArray(defs) ? defs.filter((def): def is Record<string, unknown> => Boolean(def) && typeof def === 'object' && typeof (def as Record<string, unknown>).flag === 'string') : []
		const list = given.length
			? given.map(def => ({ flag: String(def.flag), label: typeof def.label === 'string' ? def.label : '', risk: Boolean(def.risk) }))
			: defaults
		return list.map(def => ({ flag: def.flag, label: def.label, count: cards.filter(card => Boolean(card.flags?.[def.flag])).length, risk: def.risk }))
	}

}
