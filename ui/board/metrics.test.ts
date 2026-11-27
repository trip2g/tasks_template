namespace $ {

	const card = (flags: Record<string, boolean>) => ({ flags })

	$mol_test({

		'without metrics the board counts active, overdue and blocked'() {
			const counts = $trip2gtasks_board_metrics(undefined, [card({ active: true, overdue: true }), card({ active: true, blocked: true }), card({})])
			$mol_assert_equal(counts, [
				{ flag: 'active', label: '', count: 2, risk: false },
				{ flag: 'overdue', label: '', count: 1, risk: true },
				{ flag: 'blocked', label: '', count: 1, risk: true },
			])
		},

		'a board names its own flags and labels'() {
			const defs = [{ label: 'Waiting on us', flag: 'blocked', risk: true }]
			$mol_assert_equal($trip2gtasks_board_metrics(defs, [card({ blocked: true }), card({ blocked: false })]), [
				{ flag: 'blocked', label: 'Waiting on us', count: 1, risk: true },
			])
		},

		'a metric that is not a {label, flag} map is skipped'() {
			$mol_assert_equal($trip2gtasks_board_metrics([{ label: 'x' }, 'y', { flag: 'active' }], [card({ active: true })]), [
				{ flag: 'active', label: '', count: 1, risk: false },
			])
		},

	})

}
