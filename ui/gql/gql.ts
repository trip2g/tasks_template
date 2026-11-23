namespace $ {

	export type $trip2gtasks_gql_opts = {
		revalidate?: boolean
	}

	export class $trip2gtasks_gql_error extends Error {
		constructor(public detail: { message: string, path?: string[] }[]) {
			super(detail.map(err => err.message).join('. '))
		}
	}

	class $trip2gtasks_gql_marker extends $mol_object2 {
		@$mol_mem
		value(next?: number) {
			return next ?? 0
		}
	}

	const marker = new $trip2gtasks_gql_marker()

	export function $trip2gtasks_gql_marker_bump() {
		marker.value(marker.value() + 1)
	}

	export function $trip2gtasks_gql_request(query: string, variables?: object, opts?: $trip2gtasks_gql_opts): unknown {
		const mutation = /^\s*mutation\b/.test(query)
		const revalidate = opts?.revalidate !== false

		if (!mutation && revalidate) marker.value()

		const res = $mol_fetch.json('/_system/graphql', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables }),
		}) as { data?: unknown, errors?: { message: string, path?: string[] }[] }

		if (res.errors) throw new $trip2gtasks_gql_error(res.errors)

		if (mutation && revalidate) $trip2gtasks_gql_marker_bump()

		return res.data
	}

}
