namespace $ {

	export type $trip2gtasks_board_status_change = {
		set: Record<string, string>
		unset: string[]
	}

	export function $trip2gtasks_board_status_meta(from: string, to: string, done: string, today: string): $trip2gtasks_board_status_change {
		if (to === done) return { set: { status: to, done: today }, unset: [] }
		if (from === done) return { set: { status: to }, unset: ['done'] }
		return { set: { status: to }, unset: [] }
	}

}
