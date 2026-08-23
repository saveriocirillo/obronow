export const categories = [
	{ slug: 'laczniki-do-drewna', label: 'Łączniki do drewna' },
	{ slug: 'tasmy-montazowe', label: 'Taśmy montażowe' },
	{ slug: 'zlacza-ogrodowe', label: 'Złącza ogrodowe' },
	{ slug: 'zawiasy', label: 'Zawiasy' },
	{ slug: 'inne', label: 'Inne' },
] as const;

export const categoryLabel = (slug: string) =>
	categories.find((c) => c.slug === slug)?.label ?? slug;
