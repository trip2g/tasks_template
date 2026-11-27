namespace $ {

	$mol_test({

		'the owner filter is read from ?owner='() {
			$mol_assert_equal($trip2gtasks_board_owner_from('?owner=Kim%20Lee&x=1'), 'Kim Lee')
			$mol_assert_equal($trip2gtasks_board_owner_from(''), '')
		},

		'the owner filter is written to ?owner= and removed when cleared'() {
			$mol_assert_equal($trip2gtasks_board_owner_search('?x=1', 'Leo'), '?x=1&owner=Leo')
			$mol_assert_equal($trip2gtasks_board_owner_search('?owner=Leo&x=1', ''), '?x=1')
		},

		'a click on a name filters by it, a second click clears it'() {
			$mol_assert_equal($trip2gtasks_board_owner_toggle('', 'Leo'), 'Leo')
			$mol_assert_equal($trip2gtasks_board_owner_toggle('Leo', 'Leo'), '')
			$mol_assert_equal($trip2gtasks_board_owner_toggle('Maya', 'Leo'), 'Leo')
		},

	})

}
