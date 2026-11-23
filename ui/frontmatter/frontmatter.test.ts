namespace $ {

	function apply(content: string, value: string) {
		const patch = $trip2gtasks_frontmatter_set(content, 'status', value)!
		$mol_assert_equal(content.indexOf(patch.find), 0)
		return patch.replace + content.slice(patch.find.length)
	}

	$mol_test({

		'replaces a quoted status and keeps every other byte'() {
			const before = '---\ntitle: "A: b"\nstatus: "Planned"\nowner: Anna\n---\n# A\n\nstatus: "Planned" in the body\n'
			const after = '---\ntitle: "A: b"\nstatus: "In progress"\nowner: Anna\n---\n# A\n\nstatus: "Planned" in the body\n'
			$mol_assert_equal(apply(before, 'In progress'), after)
		},

		'keeps a plain status plain'() {
			$mol_assert_equal(apply('---\nstatus: Planned\n---\n', 'Done'), '---\nstatus: Done\n---\n')
		},

		'quotes a plain value that needs it'() {
			$mol_assert_equal(apply('---\nstatus: Planned\n---\n', 'Blocked: legal'), '---\nstatus: "Blocked: legal"\n---\n')
		},

		'keeps single quotes'() {
			$mol_assert_equal(apply("---\nstatus: 'Planned'\n---\n", "Owner's call"), "---\nstatus: 'Owner''s call'\n---\n")
		},

		'keeps CRLF line endings'() {
			$mol_assert_equal(apply('---\r\nstatus: "Inbox"\r\ndue: 2026-12-01\r\n---\r\nBody\r\n', 'Done'), '---\r\nstatus: "Done"\r\ndue: 2026-12-01\r\n---\r\nBody\r\n')
		},

		'adds a missing status before the closing line'() {
			$mol_assert_equal(apply('---\ntitle: X\n---\nBody', 'Inbox'), '---\ntitle: X\nstatus: Inbox\n---\nBody')
		},

		'writes Cyrillic statuses as they are'() {
			$mol_assert_equal(apply('---\nstatus: "Запланировано"\n---\n', 'В работе'), '---\nstatus: "В работе"\n---\n')
		},

		'ignores a nested status key'() {
			const before = '---\nmeta:\n  status: x\nstatus: Inbox\n---\n'
			$mol_assert_equal(apply(before, 'Done'), '---\nmeta:\n  status: x\nstatus: Done\n---\n')
		},

		'refuses a note without frontmatter'() {
			$mol_assert_equal($trip2gtasks_frontmatter_set('# Just text\n', 'status', 'Done'), null)
		},

		'reads the value it would replace'() {
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nstatus: "В работе"\n---\n', 'status'), 'В работе')
			$mol_assert_equal($trip2gtasks_frontmatter_value("---\nstatus: 'It''s'\n---\n", 'status'), "It's")
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\nstatus: Done # closed\n---\n', 'status'), 'Done')
			$mol_assert_equal($trip2gtasks_frontmatter_value('---\ntitle: x\n---\n', 'status'), null)
		},

	})

}
