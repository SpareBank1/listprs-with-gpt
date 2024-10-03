use std::collections::HashSet;
use std::process::{exit, Command};
use std::io::{self, Write};
use serde_json::Value;
use std::env;
use std::path::Path;

        fn main() {
            println!("PRs for review:\n");

            // Sett arbeidskatalog til ønsket git-repository
            let git_directory = "/Users/vidar.moe/git/awl-monorepo";  // Sett dette til ønsket sti
            if let Err(e) = env::set_current_dir(&Path::new(git_directory)) {
                eprintln!("Feil: Kunne ikke endre til katalogen {}: {}", git_directory, e);
                exit(1);
            }

            // Hent GitHub-brukernavn
            let gh_username = get_github_username();
            let author = gh_username.clone();
            let person = gh_username.clone();

            // Hent label (etikett) og teams fra argumentene
            let label = get_label();
            let teams = get_teams();

            // Hent PR-er basert på etikett, brukernavn, og teams
            let prs_by_label = fetch_prs_by_label(&label);
            let prs_by_person = fetch_prs_by_person(&person);
            let prs_by_author = fetch_prs_by_author(&author);
            let mut prs_by_teams = serde_json::json!([]);

            // Hent PR-er for hvert team og kombiner dem
            for team in teams {
                let prs = fetch_prs_by_team(&team);
                prs_by_teams = combine_prs(&prs_by_teams, &prs);
            }

            // Skriv ut PR-er laget av brukeren
            println!("PRs created by user:");
            print_pr_list(&prs_by_author);

            // Skriv ut PR-er tilordnet brukeren
            println!("\nPRs assigned to user:");
            print_pr_list(&prs_by_person);

            // Kombiner alle PR-er og fjern duplikater av de som allerede er skrevet ut
            let combined_prs = combine_all_prs(&prs_by_teams, &serde_json::json!([]), &prs_by_label, &serde_json::json!([]));
            let remaining_prs = remove_duplicate_prs(&combined_prs, &prs_by_author);
            let remaining_prs = remove_duplicate_prs(&remaining_prs, &prs_by_person);

            // Skriv ut de gjenværende PR-ene etter team og label
            println!("\nPRs by team and label:");
            print_pr_list(&remaining_prs);
        }

        // Kaller GitHub API for å hente brukernavn
        fn get_github_username() -> String {
            let output = Command::new("gh")
                .arg("api")
                .arg("user")
                .arg("--jq")
                .arg(".login")
                .output()
                .expect("Failed to fetch GitHub username");

            String::from_utf8_lossy(&output.stdout).trim().to_string()
        }

        // Kaller GitHub API for å hente PR-er etter label
        fn fetch_prs_by_label(label: &str) -> Value {
            let output = Command::new("gh")
                .arg("pr")
                .arg("list")
                .arg("--label")
                .arg(label)
                .arg("--state")
                .arg("open")
                .arg("--json")
                .arg("number,title,author,url,createdAt")
                .output()
                .expect("Failed to fetch PRs by label");

            serde_json::from_slice(&output.stdout).expect("Failed to parse PR JSON")
        }

        // Kaller GitHub API for å hente PR-er tilordnet brukeren
        fn fetch_prs_by_person(person: &str) -> Value {
            let output = Command::new("gh")
                .arg("pr")
                .arg("list")
                .arg("--assignee")
                .arg(person)
                .arg("--state")
                .arg("open")
                .arg("--json")
                .arg("number,title,author,url,createdAt")
                .output()
                .expect("Failed to fetch PRs by person");

            serde_json::from_slice(&output.stdout).expect("Failed to parse PR JSON")
        }

        // Kaller GitHub API for å hente PR-er opprettet av brukeren
        fn fetch_prs_by_author(author: &str) -> Value {
            let output = Command::new("gh")
                .arg("pr")
                .arg("list")
                .arg("--author")
                .arg(author)
                .arg("--state")
                .arg("open")
                .arg("--json")
                .arg("number,title,author,url,createdAt")
                .output()
                .expect("Failed to fetch PRs by author");

            serde_json::from_slice(&output.stdout).expect("Failed to parse PR JSON")
        }

        // Kaller GitHub API for å hente PR-er etter team
        fn fetch_prs_by_team(team: &str) -> Value {
            let output = Command::new("gh")
                .arg("pr")
                .arg("list")
                .arg("--state")
                .arg("open")
                .arg("--json")
                .arg("number,title,author,url,reviewRequests,createdAt")
                .output()
                .expect("Failed to fetch PRs by team");

            let prs: Value = serde_json::from_slice(&output.stdout).expect("Failed to parse PR JSON");

            // Filtrer PR-er etter team
            prs.as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter(|pr| pr["reviewRequests"]
                    .as_array()
                    .unwrap_or(&vec![])
                    .iter()
                    .any(|request| request["name"].as_str().unwrap_or("").contains(team)))
                .cloned()
                .collect::<Vec<_>>()
                .into()
        }

        // Kombiner to PR-lister
        fn combine_prs(prs1: &Value, prs2: &Value) -> Value {
            let combined: Vec<Value> = prs1.as_array().unwrap_or(&vec![])
                .iter()
                .chain(prs2.as_array().unwrap_or(&vec![]).iter())
                .cloned()
                .collect();
            serde_json::json!(combined)
        }

        // Fjern duplikater basert på `number`
        fn remove_duplicate_prs(combined_prs: &Value, exclude_prs: &Value) -> Value {
            let exclude_numbers: HashSet<u64> = exclude_prs
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|pr| pr["number"].as_u64())
                .collect();

            let filtered_prs: Vec<Value> = combined_prs
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter(|pr| !exclude_numbers.contains(&pr["number"].as_u64().unwrap_or(0)))
                .cloned()
                .collect();

            serde_json::json!(filtered_prs)
        }

        // Skriv ut en liste av PR-er i ønsket format
        fn print_pr_list(prs: &Value) {
            for pr in prs.as_array().unwrap_or(&vec![]) {
                println!(
                    "PR #{}\nAuthor: {}\nTitle: {}\nDate: {}\nURL: {}\n",
                    pr["number"],
                    pr["author"]["login"],
                    pr["title"],
                    pr["createdAt"],
                    pr["url"]
                );
            }
        }

        // Kombiner alle PR-er (uten deduplisering, dette er bare for demonstrasjon)
        fn combine_all_prs(
            prs_by_teams: &Value,
            prs_by_author: &Value,
            prs_by_label: &Value,
            prs_by_person: &Value,
        ) -> Value {
            let combined_prs = [
                prs_by_teams,
                prs_by_author,
                prs_by_label,
                prs_by_person,
            ]
                .iter()
                .flat_map(|prs| prs.as_array().unwrap_or(&vec![]).to_owned())
                .collect::<Vec<_>>();

            serde_json::json!(combined_prs)
        }

        // Hent label-argumentet
        fn get_label() -> String {
            std::env::args().nth(1).expect("Label argument missing")
        }

        // Hent team-argumenter (resten av argumentene)
        fn get_teams() -> Vec<String> {
            std::env::args().skip(2).collect()
        }

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_combine_prs() {
        let prs1 = json!([
            {"number": 1, "title": "PR1", "author": {"login": "user1"}, "url": "url1", "createdAt": "2024-08-15T12:00:00Z"},
            {"number": 2, "title": "PR2", "author": {"login": "user2"}, "url": "url2", "createdAt": "2024-08-14T12:00:00Z"}
        ]);
        let prs2 = json!([
            {"number": 3, "title": "PR3", "author": {"login": "user3"}, "url": "url3", "createdAt": "2024-08-13T12:00:00Z"},
            {"number": 4, "title": "PR4", "author": {"login": "user4"}, "url": "url4", "createdAt": "2024-08-12T12:00:00Z"}
        ]);

        let combined = combine_prs(&prs1, &prs2);
        assert_eq!(combined.as_array().unwrap().len(), 4);
        assert_eq!(combined[0]["number"], json!(1));
        assert_eq!(combined[1]["number"], json!(2));
        assert_eq!(combined[2]["number"], json!(3));
        assert_eq!(combined[3]["number"], json!(4));
    }

    #[test]
    fn test_remove_duplicate_prs() {
        let combined_prs = json!([
            {"number": 1, "title": "PR1", "author": {"login": "user1"}, "url": "url1", "createdAt": "2024-08-15T12:00:00Z"},
            {"number": 2, "title": "PR2", "author": {"login": "user2"}, "url": "url2", "createdAt": "2024-08-14T12:00:00Z"},
            {"number": 3, "title": "PR3", "author": {"login": "user3"}, "url": "url3", "createdAt": "2024-08-13T12:00:00Z"}
        ]);

        let exclude_prs = json!([
            {"number": 2, "title": "PR2", "author": {"login": "user2"}, "url": "url2", "createdAt": "2024-08-14T12:00:00Z"},
            {"number": 4, "title": "PR4", "author": {"login": "user4"}, "url": "url4", "createdAt": "2024-08-12T12:00:00Z"}
        ]);

        let filtered_prs = remove_duplicate_prs(&combined_prs, &exclude_prs);

        // Test at PR med nummer 2 er fjernet, og at PR med nummer 1 og 3 forblir
        assert_eq!(filtered_prs.as_array().unwrap().len(), 2);
        assert_eq!(filtered_prs[0]["number"], json!(1));
        assert_eq!(filtered_prs[1]["number"], json!(3));
    }

    #[test]
    fn test_print_pr_list() {
        let prs = json!([
        {"number": 1, "title": "PR1", "author": {"login": "user1"}, "url": "url1", "createdAt": "2024-08-15T12:00:00Z"},
        {"number": 2, "title": "PR2", "author": {"login": "user2"}, "url": "url2", "createdAt": "2024-08-14T12:00:00Z"}
    ]);

        let mut output = String::new();
        for pr in prs.as_array().unwrap_or(&vec![]) {
            output.push_str(&format!(
                "PR #{}\nAuthor: {}\nTitle: {}\nDate: {}\nURL: {}\n\n",
                pr["number"],
                pr["author"]["login"].as_str().unwrap_or(""),
                pr["title"].as_str().unwrap_or(""),
                pr["createdAt"].as_str().unwrap_or(""),
                pr["url"].as_str().unwrap_or("")
            ));
        }

        let expected_output = "\
PR #1\nAuthor: user1\nTitle: PR1\nDate: 2024-08-15T12:00:00Z\nURL: url1\n\n\
PR #2\nAuthor: user2\nTitle: PR2\nDate: 2024-08-14T12:00:00Z\nURL: url2\n\n";

        assert_eq!(output, expected_output);
    }

    #[test]
    fn test_combine_all_prs() {
        let prs_by_teams = json!([
            {"number": 1, "title": "Person PR1", "author": {"login": "person1"}, "url": "url1", "createdAt": "2024-08-10T12:00:00Z"},
            {"number": 2, "title": "Person PR2", "author": {"login": "person2"}, "url": "url2", "createdAt": "2024-08-10T12:00:00Z"}
        ]);
        let prs_by_author = json!([
            {"number": 3, "title": "Person PR3", "author": {"login": "person3"}, "url": "url3", "createdAt": "2024-08-10T12:00:00Z"}
        ]);
        let prs_by_label = json!([
            {"number": 1, "title": "Person PR1", "author": {"login": "person1"}, "url": "url1", "createdAt": "2024-08-10T12:00:00Z"}
        ]);
        let prs_by_person = json!([
            {"number": 2, "title": "Person PR2", "author": {"login": "person2"}, "url": "url2", "createdAt": "2024-08-10T12:00:00Z"}
        ]);

        let combined = combine_all_prs(&prs_by_teams, &prs_by_author, &prs_by_label, &prs_by_person);

        // Test at alle PR-er er kombinert (uten deduplisering)
        assert_eq!(combined.as_array().unwrap().len(), 5);

        // Sjekk at alle PR-ene er med
        assert!(combined.as_array().unwrap().iter().any(|pr| pr["number"] == json!(1) && pr["title"] == json!("Team PR1")));
        assert!(combined.as_array().unwrap().iter().any(|pr| pr["number"] == json!(1) && pr["title"] == json!("Label PR1")));
        assert!(combined.as_array().unwrap().iter().any(|pr| pr["number"] == json!(2) && pr["title"] == json!("Team PR2")));
        assert!(combined.as_array().unwrap().iter().any(|pr| pr["number"] == json!(2) && pr["title"] == json!("Person PR1")));
        assert!(combined.as_array().unwrap().iter().any(|pr| pr["number"] == json!(3) && pr["title"] == json!("Author PR1")));
    }
}
