namespace $.$$ {

	export type $trip2gtasks_boards_row = {
		path: string
		title: string
		permalink: string
		custom: boolean
		columns?: { status: string, count: number }[]
		outside?: number
		total?: number
		overdue?: number
		no_owner?: number
		no_due?: number
		blocked?: number
		needs_decision: number
	}

	export class $trip2gtasks_boards extends $.$trip2gtasks_boards {

		config() {
			return $trip2gtasks_env_config()
		}

		query_name() {
			const query = this.config().meta?.boards_query
			return typeof query === 'string' && query ? query : '[[boards_index]]'
		}

		override page_title() {
			return this.config().title
		}

		run(params: Record<string, unknown>) {
			const variables = { input: { query: this.query_name(), params } }
			return $trip2gtasks_boards_list(variables).noteQuery
		}

		@$mol_mem
		boards(): $trip2gtasks_boards_row[] {
			let res = this.run({})
			if (res.__typename === 'ErrorPayload' && $trip2gtasks_env_clock_missing(res.message)) {
				res = this.run({ today: $trip2gtasks_env_today() })
			}
			if (res.__typename === 'ErrorPayload') throw new Error(res.message)
			return Array.isArray(res.result) ? res.result as $trip2gtasks_boards_row[] : []
		}

		@$mol_mem
		override problem_text() {
			try {
				this.boards()
				return ''
			} catch (error) {
				if ($mol_promise_like(error)) $mol_fail_hidden(error)
				return (error as Error).message
			}
		}

		override boards_body() {
			if (this.problem_text()) return [this.Problem()]
			if (!this.boards().length) return [this.Empty()]
			return [this.Rows()]
		}

		@$mol_mem
		board_map() {
			return new Map(this.boards().map(board => [board.path, board]))
		}

		board(path: string) {
			return this.board_map().get(path)!
		}

		override rows() {
			return this.boards().map(board => this.Row(board.path))
		}

		override row_uri(path: string) {
			return $trip2gtasks_env_url(this.board(path).permalink)
		}

		override row_title(path: string) {
			return this.board(path).title
		}

		override row_cells(path: string) {
			if (this.board(path).custom) return [this.Board_cell(path), this.Custom_cell(path)]

			return [
				this.Board_cell(path),
				this.Decision_cell(path),
				this.Overdue_cell(path),
				this.Owner_cell(path),
				this.Due_cell(path),
				this.Status_cell(path),
			]
		}

		override row_decision(path: string) {
			return String(this.board(path).needs_decision)
		}

		override row_decision_tone(path: string) {
			return this.board(path).needs_decision > 0 ? 'warn' : 'ok'
		}

		override row_overdue(path: string) {
			return String(this.board(path).overdue ?? 0)
		}

		override row_no_owner(path: string) {
			return String(this.board(path).no_owner ?? 0)
		}

		override row_no_due(path: string) {
			return String(this.board(path).no_due ?? 0)
		}

		override row_statuses(path: string) {
			const board = this.board(path)
			const parts = (board.columns ?? []).map(column => `${column.status} ${column.count}`)
			if (board.outside) parts.push(`${this.other_label()} ${board.outside}`)
			return parts.join(' · ')
		}

	}

}
