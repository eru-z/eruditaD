export const APPROVED_SKILL_NAMES = [
  "React.js", "Node.js", "Python", "HTML", "CSS", "JS", "WordPress", "Bootstrap", "git/GitHub", "Expo", "Vercel", "Hosting/Domains", "Supabase", "React Native", "Tailwind", "PHP", "PostgreSQL", "MySQL",
];

const aliases = { "React JS": "React.js", JavaScript: "JS", "Tailwind CSS": "Tailwind", Git: "git/GitHub", GitHub: "git/GitHub", Hosting: "Hosting/Domains" };
const approved = new Set(APPROVED_SKILL_NAMES);

export const SKILL_LOGOS = {
  "React.js": "https://cdn.simpleicons.org/react/61DAFB",
  "Node.js": "https://cdn.simpleicons.org/nodedotjs/5FA04E",
  Python: "https://cdn.simpleicons.org/python/3776AB",
  HTML: "https://cdn.simpleicons.org/html5/E34F26",
  CSS: "https://cdn.simpleicons.org/css/1572B6",
  JS: "https://cdn.simpleicons.org/javascript/F7DF1E",
  WordPress: "https://cdn.simpleicons.org/wordpress/21759B",
  Bootstrap: "https://cdn.simpleicons.org/bootstrap/7952B3",
  "git/GitHub": "https://cdn.simpleicons.org/github/181717",
  Expo: "https://cdn.simpleicons.org/expo/000020",
  Vercel: "https://cdn.simpleicons.org/vercel/000000",
  "Hosting/Domains": "https://cdn.simpleicons.org/cloudflare/F38020",
  Supabase: "https://cdn.simpleicons.org/supabase/3FCF8E",
  "React Native": "https://cdn.simpleicons.org/react/61DAFB",
  Tailwind: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
  PHP: "https://cdn.simpleicons.org/php/777BB4",
  PostgreSQL: "https://cdn.simpleicons.org/postgresql/4169E1",
  MySQL: "https://cdn.simpleicons.org/mysql/4479A1",
};

export function skillLogo(name, customLogo = "") {
  return customLogo || SKILL_LOGOS[aliases[name] || name] || "";
}
export function publicSkills(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.published !== false)
    .map((item) => ({ ...item, name: aliases[item.name] || item.name }))
    .filter((item) => approved.has(item.name));
}