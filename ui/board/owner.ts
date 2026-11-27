namespace $ {

	export function $trip2gtasks_board_owner_from(search: string) {
		return new URLSearchParams(search).get('owner') ?? ''
	}

	export function $trip2gtasks_board_owner_search(search: string, owner: string) {
		const params = new URLSearchParams(search)
		params.delete('owner')
		if (owner) params.append('owner', owner)
		const text = params.toString().replace(/\+/g, '%20')
		return text ? `?${text}` : ''
	}

	export function $trip2gtasks_board_owner_toggle(current: string, picked: string) {
		return current === picked ? '' : picked
	}

}
