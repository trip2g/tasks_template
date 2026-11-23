namespace $ {

	$mol_test({

		'reads a quoted, a single-quoted and a plain value'() {
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nstatus: "В работе"\n---\n', 'status'), 'В работе')
			$mol_assert_equal($trip2gtasks_frontmatter_value("---\nstatus: 'It''s'\n---\n", 'status'), "It's")
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nstatus:   Done # closed\n---\n', 'status'), 'Done')
		},

		'reads only the top level of the frontmatter'() {
			const content = '---\nmeta:\n  status: nested\nstatus: Inbox\n---\nstatus: body\n'
			$mol_assert_equal($trip2gtasks_frontmatter_value(content, 'status'), 'Inbox')
		},

		'treats an absent key, an empty string and null alike'() {
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\ntitle: x\n---\n', 'owner'), null)
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nowner: ""\n---\n', 'owner'), null)
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nowner:\n---\n', 'owner'), null)
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nowner: null\n---\n', 'owner'), null)
		},

		'returns null for a note without frontmatter'() {
			$mol_assert_equal($trip2gtasks_frontmatter_value('status: Done\n', 'status'), null)
		},

	})

}
