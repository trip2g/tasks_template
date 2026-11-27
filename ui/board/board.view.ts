namespace $.$$ {

	export type $trip2gtasks_board_card = {
		path: string
		title: string
		permalink: string
		status: string
		owner: string
		project: string
		due: string
		due_date: boolean
		overdue: boolean
		blocked: string
		disposition: string
		done: string
		flags?: Record<string, boolean>
	}

	export type $trip2gtasks_board_data = {
		today: string
		columns: string[]
		done_column: string
		tasks: $trip2gtasks_board_card[]
	}

	type Move = { from: string, to: string }

	type Notice = { title: string, text: string, tone: string }

	const outside = '\u0000outside'
	const nobody = '\u0000nobody'
	const notice_key = 'trip2gtasks_notice'

	export class $trip2gtasks_board extends $.$trip2gtasks_board {

		config() {
			return $trip2gtasks_env_config()
		}

		meta() {
			return this.config().meta ?? {}
		}

		override editable() {
			return Boolean(this.config().editable)
		}

		override board_title() {
			return this.config().title
		}

		query_name() {
			const query = this.meta().tasks_query
			return typeof query === 'string' && query ? query : '[[tasks_board]]'
		}

		done_days() {
			const days = Number(this.meta().tasks_done_days ?? 14)
			return Number.isFinite(days) && days >= 0 ? days : 14
		}

		today() {
			return $trip2gtasks_env_today()
		}

		params() {
			const meta = this.meta()
			const params: Record<string, unknown> = {}

			const filter = meta.tasks_filter
			if (filter && typeof filter === 'object' && !Array.isArray(filter)) params.filter = filter

			const columns = meta.tasks_columns
			if (Array.isArray(columns) && columns.length > 0) params.columns = columns.map(String)

			const done = meta.done
			if (Array.isArray(done) && done.length > 0) params.done = done.map(String)

			return params
		}

		run(params: Record<string, unknown>) {
			const variables = { input: { query: this.query_name(), params } }
			return $trip2gtasks_board_tasks(variables).noteQuery
		}

		@$mol_mem
		board(): $trip2gtasks_board_data {
			let res = this.run(this.params())
			if (res.__typename === 'ErrorPayload' && $trip2gtasks_env_clock_missing(res.message)) {
				res = this.run({ ...this.params(), today: this.today() })
			}
			if (res.__typename === 'ErrorPayload') throw new Error(res.message)

			const data = res.result as Partial<$trip2gtasks_board_data> & { today?: string }
			const columns = Array.isArray(data.columns) ? data.columns : []

			return {
				today: data.today || this.today(),
				columns,
				done_column: data.done_column ?? columns[columns.length - 1] ?? '',
				tasks: Array.isArray(data.tasks) ? data.tasks : [],
			}
		}

		@$mol_mem
		board_error() {
			try {
				this.board()
				return ''
			} catch (error) {
				if ($mol_promise_like(error)) $mol_fail_hidden(error)
				return (error as Error).message
			}
		}

		@$mol_mem
		notice(next?: Notice | null): Notice | null {
			if (next !== undefined) return next
			return $trip2gtasks_env_carried<Notice>(notice_key)
		}

		override problem_title() {
			return this.board_error() ? this.query_failed_label() : this.notice()?.title ?? ''
		}

		override problem_text() {
			return this.board_error() || this.notice()?.text || ''
		}

		override problem_tone() {
			return this.board_error() ? 'bad' : this.notice()?.tone ?? 'bad'
		}

		override board_body() {
			if (this.board_error()) return [this.Problem()]

			return [
				this.Metrics(),
				...this.notice() ? [this.Problem()] : [],
				...this.editable() ? [] : [this.Signin()],
				this.Swipe_hint(),
				this.Columns(),
				...this.cancelled_count() ? [this.Cancelled()] : [],
			]
		}

		@$mol_mem
		moves(next?: Record<string, Move>) {
			return next ?? {}
		}

		@$mol_mem
		cards() {
			const moves = this.moves()

			const { done_column, today } = this.board()

			return this.board().tasks.map(card => {
				const move = moves[card.path]
				if (!move || move.from !== card.status) return card
				const done = move.to === done_column ? today : move.from === done_column ? '' : card.done
				return { ...card, status: move.to, done }
			})
		}

		@$mol_mem
		card_map() {
			return new Map(this.cards().map(card => [card.path, card]))
		}

		card(path: string) {
			return this.card_map().get(path)!
		}

		@$mol_mem
		visible() {
			const query = this.search().trim().toLowerCase()
			const owner = this.owner_filter()

			return this.cards().filter(card => {
				if (card.disposition === 'cancelled') return false
				if (owner === nobody && card.owner) return false
				if (owner && owner !== nobody && card.owner !== owner) return false
				if (!query) return true
				const haystack = [card.title, card.owner, card.project, card.blocked, card.status].join('\n').toLowerCase()
				return haystack.includes(query)
			})
		}

		@$mol_mem
		metrics() {
			return $trip2gtasks_board_metrics(this.meta().metrics, this.visible())
		}

		override metric_views() {
			return this.metrics().map((_, index) => this.Metric(index))
		}

		metric_label(flag: string) {
			if (flag === 'active') return this.active_label()
			if (flag === 'overdue') return this.overdue_metric_label()
			if (flag === 'blocked') return this.blocked_metric_label()
			return flag
		}

		override metric_title(index: number) {
			const metric = this.metrics()[index]
			return `${metric.label || this.metric_label(metric.flag)}: ${metric.count}`
		}

		override metric_tone(index: number) {
			const metric = this.metrics()[index]
			return metric.risk && metric.count > 0 ? 'bad' : 'neutral'
		}

		@$mol_mem
		owner_options() {
			const owners = [...new Set(this.cards().map(card => card.owner).filter(Boolean))].sort()
			return {
				'': this.everyone_label(),
				[nobody]: this.no_owner_label(),
				...Object.fromEntries(owners.map(owner => [owner, owner])),
			}
		}

		columns() {
			return this.board().columns
		}

		@$mol_mem
		column_keys() {
			const columns = this.columns()
			const stray = this.visible().some(card => !columns.includes(card.status))
			return stray ? [...columns, outside] : columns
		}

		@$mol_mem
		cancelled_count() {
			return this.cards().filter(card => card.disposition === 'cancelled').length
		}

		override cancelled_text() {
			return this.cancelled_label().replace('{count}', String(this.cancelled_count()))
		}

		override swipe_hint() {
			return this.swipe_label().replace('{count}', String(this.column_keys().length))
		}

		override column_views() {
			return this.column_keys().map(key => this.Column(key))
		}

		override column_droppable(key: string) {
			return this.editable() && key !== outside
		}

		override column_title(key: string) {
			return key === outside ? this.outside_label() : key
		}

		@$mol_mem_key
		column_cards(key: string) {
			const columns = this.columns()
			const cards = this.visible().filter(card => key === outside ? !columns.includes(card.status) : card.status === key)

			return cards.sort((a, b) => {
				if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
				const due = (a.due_date ? a.due : '9999') .localeCompare(b.due_date ? b.due : '9999')
				return due || a.title.localeCompare(b.title)
			})
		}

		finished_on(card: $trip2gtasks_board_card) {
			const date = /^\d{4}-\d{2}-\d{2}$/
			if (date.test(card.done)) return card.done
			if (card.due_date) return card.due
			return ''
		}

		@$mol_mem_key
		column_split(key: string) {
			const cards = this.column_cards(key)
			if (key !== this.board().done_column) return { recent: cards, older: [] as typeof cards }

			const today = this.board().today
			const limit = this.done_days()
			const old = (card: $trip2gtasks_board_card) => {
				const date = this.finished_on(card)
				return !date || $trip2gtasks_env_days_between(date, today) > limit
			}

			return { recent: cards.filter(card => !old(card)), older: cards.filter(old) }
		}

		override column_count(key: string) {
			return String(this.column_cards(key).length)
		}

		override older_title(key: string) {
			return this.older_label().replace('{count}', String(this.column_split(key).older.length))
		}

		override column_rows(key: string) {
			const { recent, older } = this.column_split(key)
			const rows: $mol_view[] = [this.Column_head(key)]

			if (!recent.length && !older.length) rows.push(this.Column_empty(key))
			rows.push(...recent.map(card => this.Card(card.path)))

			if (older.length) {
				rows.push(this.Older(key))
				if (this.older_shown(key)) rows.push(...older.map(card => this.Card(card.path)))
			}

			return rows
		}

		override card_path(path: string) {
			return path
		}

		override card_title(path: string) {
			return this.card(path).title
		}

		override card_marks(path: string) {
			const card = this.card(path)
			return [
				this.Owner_mark(path),
				...card.due ? [this.Due_mark(path)] : [],
				...card.blocked ? [this.Blocked_mark(path)] : [],
				...card.disposition === 'paused' ? [this.Paused_mark(path)] : [],
			]
		}

		override card_owner(path: string) {
			return this.card(path).owner || this.no_owner_label()
		}

		override card_owner_tone(path: string) {
			return this.card(path).owner ? 'neutral' : 'warn'
		}

		override card_due(path: string) {
			const card = this.card(path)
			return card.overdue ? this.overdue_label().replace('{due}', card.due) : card.due
		}

		override card_due_tone(path: string) {
			return this.card(path).overdue ? 'bad' : 'neutral'
		}

		override card_blocked(path: string) {
			return this.card(path).blocked
		}

		override card_open(path: string, event?: Event) {
			this.task_opened(path)
		}

		@$mol_mem
		task_opened(next?: string) {
			return next ?? ''
		}

		override task_close() {
			this.task_opened('')
		}

		override board_pages() {
			const path = this.task_opened()
			return path && this.card_map().has(path) ? [this.Board_page(), this.Task_page()] : [this.Board_page()]
		}

		override task_title() {
			return this.card(this.task_opened()).title
		}

		override task_uri() {
			return $trip2gtasks_env_url(this.card(this.task_opened()).permalink)
		}

		override status_options() {
			return Object.fromEntries(this.columns().map(column => [column, column]))
		}

		override task_status(next?: string) {
			const path = this.task_opened()
			if (next !== undefined) $mol_wire_async(this).move(path, next)
			return this.card(path).status
		}

		override card_adopt(transfer: DataTransfer) {
			const path = transfer.getData('text/plain')
			return this.card_map().has(path) ? path : null
		}

		override column_receive(key: string, path: string) {
			$mol_wire_async(this).move(path, key)
		}

		move(path: string, status: string) {
			const card = this.board().tasks.find(task => task.path === path)
			if (!card || card.status === status) return

			this.notice(null)
			this.moves({ ...this.moves(), [path]: { from: card.status, to: status } })

			try {
				this.save(card, status)
			} catch (error) {
				if ($mol_promise_like(error)) $mol_fail_hidden(error)
				this.forget(path)
				if (error instanceof $trip2gtasks_gql_error) return this.signed_out()
				this.notice({ title: this.refused_label(), text: (error as Error).message, tone: 'bad' })
			}
		}

		signed_out() {
			$trip2gtasks_env_reload(notice_key, { title: this.refused_label(), text: this.signed_out_label(), tone: 'bad' })
		}

		forget(path: string) {
			const { [path]: _, ...rest } = this.moves()
			this.moves(rest)
		}

		conflict(path: string) {
			this.forget(path)
			this.notice({ title: this.conflict_label(), text: path, tone: 'warn' })
			$trip2gtasks_gql_marker_bump()
		}

		save(card: $trip2gtasks_board_card, status: string) {
			const note = $trip2gtasks_board_read({ paths: [card.path] }, { revalidate: false }).notePaths[0]
			if (!note) throw new Error(card.path)

			if (($trip2gtasks_frontmatter_value(note.content, 'status') ?? '') !== card.status) return this.conflict(card.path)

			const { done_column, today } = this.board()
			const { set, unset } = $trip2gtasks_board_status_meta(card.status, status, done_column, today)
			const change = { meta: { path: card.path, set, unset, expectedHash: note.latestContentHash } }
			const res = $trip2gtasks_board_save({ input: { changes: [change] } }).updateNotes

			switch (res.__typename) {
				case 'UpdateNotesSuccessPayload': {
					const warnings = res.updated.flatMap(note => note.warnings.filter(warning => warning.level !== 'INFO').map(warning => `${warning.level}: ${warning.message}`))
					if (warnings.length) this.notice({ title: this.saved_warning_label(), text: warnings.join('\n'), tone: 'warn' })
					return
				}
				case 'UpdateNotesHashMismatchPayload':
					return this.conflict(card.path)
				case 'ErrorPayload':
					throw new Error(res.message)
			}
		}

	}

}
