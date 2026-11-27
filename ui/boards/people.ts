namespace $ {

	type Row = { custom: boolean, permalink: string, total?: number, owners?: string[] }

	export function $trip2gtasks_boards_people(rows: Row[]) {
		const counted = rows.filter(row => !row.custom)
		const names = [...new Set(counted.flatMap(row => row.owners ?? []))].sort((a, b) => a.localeCompare(b))
		return names.map(name => {
			const home = counted
				.filter(row => (row.owners ?? []).includes(name))
				.reduce<Row | null>((best, row) => !best || (row.total ?? 0) > (best.total ?? 0) ? row : best, null)
			return { name, home: home?.permalink ?? '' }
		})
	}

	export function $trip2gtasks_boards_person_uri(home: string, person: string) {
		return `${home}?owner=${encodeURIComponent(person)}`
	}

}
