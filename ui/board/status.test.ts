namespace $ {

	$mol_test({

		'moving into the done column sets done to today'() {
			$mol_assert_equal($trip2gtasks_board_status_meta('Planned', 'Done', 'Done', '2026-11-23'), { set: { status: 'Done', done: '2026-11-23' }, unset: [] })
		},

		'leaving the done column removes done'() {
			$mol_assert_equal($trip2gtasks_board_status_meta('Done', 'In progress', 'Done', '2026-11-23'), { set: { status: 'In progress' }, unset: ['done'] })
		},

		'a move between open columns touches only status'() {
			$mol_assert_equal($trip2gtasks_board_status_meta('Inbox', 'Planned', 'Done', '2026-11-23'), { set: { status: 'Planned' }, unset: [] })
		},

	})

}
