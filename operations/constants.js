export const id_to_name = {
	"2": {
		name: "Tasks",
		id: 2,
		key: "TODOS",
	},
	"3": {
		name: "Discussions",
		id: 3,
		key: "DISCUSSIONS",
	},
	"4": {
		name: "Milestones",
		id: 4,
		key: "MILESTONES",
	},
	"5": {
		name: "Time",
		id: 5,
		key: "TIME",
	},
	"6": {
		name: "Files",
		id: 6,
		key: "FILES",
	},
	"7": {
		name: "Invoices",
		id: 7,
		key: "INVOICES",
	},
	"13": {
		name: "Issue Tracker",
		id: 13,
		key: "BUGTRACKER",
	},
	"14": {
		name: "Wikis",
		id: 14,
		key: "WIKI",
	},
	"16": {
		name: "CRM",
		id: 16,
		key: "CRM",
	},
	"17": {
		name: "Passwords",
		id: 17,
		key: "PASSMAN",
	},
	"19": {
		name: "Calendar",
		id: 19,
		key: "CALENDAR",
	},
	"20": {
		name: "Invoices",
		id: 20,
		key: "INVOICESPLUS",
	},
	"37": {
		name: "Overview",
		id: 37,
		key: "PEOPLE",
	},
	"47": {
		name: "Planner",
		id: 47,
		key: "PLANNER",
	},
	"48": {
		name: "Translations",
		id: 48,
		key: "TRANSLATIONS",
	},
};
export const name_to_app_id = (name) => {
	let resultId = 2;
	Object.keys(id_to_name).map((key) => {
		if (id_to_name[key].name === name) {
			resultId = id_to_name[key].id;
		}
	});
	return resultId;
};
export const statuses = {
	STATUS_NOT_STARTED: 0,
	STATUS_COMPLETED: 1,
	STATUS_IN_PROGRESS: 2,
	STATUS_INVALID: 3,
	STATUS_REVIEW: 4,
};

export const filterMap = {
	due_date_from: "due_date[from]",
	due_date_to: "due_date[to]",
	created_date_from: "created_date[from]",
	created_date_to: "created_date[to]",
};

export const status_ids = {
	0: "STATUS_NOT_STARTED",
	1: "STATUS_COMPLETED",
	2: "STATUS_IN_PROGRESS",
	3: "STATUS_INVALID",
	4: "STATUS_REVIEW",
};

export const priorities = {
	none: 0,
	low: 1,
	medium: 2,
	high: 3,
};

export const priority_ids = {
	0: "none",
	1: "low",
	2: "medium",
	3: "high",
};

export const apps = {
	BACKUPS: 0,
	TODOS: 2,
	DISCUSSIONS: 3,
	MILESTONES: 4,
	TIME: 5,
	FILES: 6,
	INVOICES: 7, // removed
	BUGTRACKER: 13,
	WIKI: 14,
	CRM: 16,
	PASSMAN: 17,
	TASKY: 18,
	CALENDAR: 19,
	INVOICESPLUS: 20,
	PEOPLE: 37,
	PLANNER: 47,
	TRANSLATIONS: 48,
};
export const names = {
	TODOS: "tasks",
	MILESTONES: "milestones",
	BUGTRACKER: "issuetracker",
	DISCUSSIONS: "discussions",
	CALENDAR: "calendar",
	WIKI: "wiki",
	TIME: "time",
	FILES: "files",
	PLANNER: "planner",
	TRANSLATIONS: "translations",
	PEOPLE: "overview",
	PASSMAN: "passwords",
	CRM: "crm",
	INVOICESPLUS: "invoicesplus",
};
