// function to capitalise an string like HOME DEPOT even those like HOME_DEPOT to Home Depot
export function capitalizeString(str: string) {
  return str
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// function to convert a string to a slug
export function stringToSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[_\s]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/[^\w-]+/g, "") // Remove all non-word characters except hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Trim hyphens from the start and end
}

// function to convert a slug to a string
export function slugToString(slug: string) {
  return slug
    .replace(/-/g, " ") // Replace hyphens with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
}

// function to format a date to a more readable format like "January 1, 2023" including the time
export function formatDate(date: string | Date) {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return dateObj.toLocaleDateString("en-US", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

// function to format a number to a more readable format like 1,000,000
export function formatNumber(num: number) {
  return num.toLocaleString("en-US");
}

// function to format a currency to a more readable format like $1,000.00
export function formatCurrency(num: number, currency: string = "USD") {
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: currency,
  });
}

// function to truncate a string to a certain length and add ellipsis
export function truncateString(str: string, length: number) {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length) + "...";
}
