namespace $ {

	$mol_test({

		'a person links to the biggest board that has their tasks'() {
			const rows = [
				{ custom: false, permalink: '/boards/newsletter', total: 3, owners: ['Sam'] },
				{ custom: false, permalink: '/boards/website', total: 7, owners: ['Leo', 'Maya'] },
				{ custom: false, permalink: '/boards/all', total: 10, owners: ['Leo', 'Maya', 'Sam'] },
				{ custom: true, permalink: '/boards/overdue' },
			]
			$mol_assert_equal($trip2gtasks_boards_people(rows), [
				{ name: 'Leo', home: '/boards/all' },
				{ name: 'Maya', home: '/boards/all' },
				{ name: 'Sam', home: '/boards/all' },
			])
			$mol_assert_equal($trip2gtasks_boards_people(rows.slice(0, 2)), [
				{ name: 'Leo', home: '/boards/website' },
				{ name: 'Maya', home: '/boards/website' },
				{ name: 'Sam', home: '/boards/newsletter' },
			])
			$mol_assert_equal($trip2gtasks_boards_person_uri('/boards/all', 'Kim Lee'), '/boards/all?owner=Kim%20Lee')
		},

	})

}
