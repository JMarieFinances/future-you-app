export type HouseholdSectionKey =
  | "incomeSources"
  | "bills"
  | "spending"
  | "savings";

export const householdSections: {
  key: HouseholdSectionKey;
  title: string;
  items: string[];
}[] = [
  {
    key: "incomeSources",
    title: "Household Income",
    items: ["Your Contribution", "Partner Contribution", "Other Income"],
  },
  {
    key: "bills",
    title: "Bills",
    items: [
      "Rent / Mortgage",
      "Electricity",
      "Water",
      "Gas",
      "Internet",
      "Phone",
      "Insurance",
      "Subscriptions",
    ],
  },
  {
    key: "spending",
    title: "Household Spending",
    items: [
      "Groceries",
      "Household Supplies",
      "Cleaning Supplies",
      "Toiletries",
      "Pets",
      "Kids",
      "Dining Out",
      "Miscellaneous",
    ],
  },
  {
    key: "savings",
    title: "Household Savings",
    items: [
      "Emergency Fund",
      "Moving Fund",
      "Vacation",
      "Home Repairs",
      "Furniture",
      "Holiday Fund",
    ],
  },
];