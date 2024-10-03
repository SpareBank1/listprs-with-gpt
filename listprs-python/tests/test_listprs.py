import unittest
from unittest.mock import patch, MagicMock
import json
import os
import sys

# Legg til rotkatalogen (en nivå opp) i sys.path siden det er der listprs ligger:
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from listprs import fetch_github_username, format_pr_details, fetch_prs_assigned_to_teams, filter_out_prs
class TestGithubPRFetcher(unittest.TestCase):

    @patch('subprocess.run')
    def test_fetch_github_username(self, mock_run):
        mock_run.return_value = MagicMock(stdout='testuser\n')
        username = fetch_github_username()
        self.assertEqual(username, 'testuser')

    def test_format_pr_details(self):
        prs = [{
            'number': 1,
            'title': 'Test PR',
            'author': {'login': 'testuser'},
            'url': 'http://example.com',
            'reviewRequests': [],
            'createdAt': '2023-01-01T00:00:00Z'
        }]
        formatted_prs = format_pr_details(prs)
        expected_output = (
            "PR #1\n"
            "Author: testuser\n"
            "Title: Test PR\n"
            "Date: 2023-01-01T00:00:00Z\n"
            "URL: http://example.com\n"
        )
        self.assertEqual(formatted_prs, expected_output)

    def test_filter_out_prs(self):
        prs = [
            {'number': 1, 'title': 'Test PR 1', 'author': {'login': 'testuser'}, 'url': 'http://example.com', 'reviewRequests': [], 'createdAt': '2023-01-01T00:00:00Z'},
            {'number': 2, 'title': 'Test PR 2', 'author': {'login': 'anotheruser'}, 'url': 'http://example.com', 'reviewRequests': [], 'createdAt': '2023-01-01T00:00:00Z'}
        ]
        prs_to_filter_out = [{'number': 1, 'title': 'Test PR 1', 'author': {'login': 'testuser'}, 'url': 'http://example.com', 'reviewRequests': [], 'createdAt': '2023-01-01T00:00:00Z'}]
        filtered_prs = filter_out_prs(prs, prs_to_filter_out)
        self.assertEqual(len(filtered_prs), 1)
        self.assertEqual(filtered_prs[0]['number'], 2)

    @patch('subprocess.run')
    def test_fetch_prs_assigned_to_teams(self, mock_run):
        mock_output = json.dumps([{
            'number': 3,
            'title': 'Team PR',
            'author': {'login': 'teamuser'},
            'url': 'http://example.com',
            'reviewRequests': [],
            'createdAt': '2023-01-01T00:00:00Z'
        }])
        mock_run.return_value = MagicMock(stdout=mock_output)
        prs = fetch_prs_assigned_to_teams(['team1', 'team2'])
        self.assertEqual(len(prs), 1)
        self.assertEqual(prs[0]['number'], 3)

    def test_combined_filtering_logic(self):
        prs_by_label = [
            {'number': 1, 'title': 'Author PR 1', 'author': {'login': 'testuser'}, 'url': 'http://example.com', 'reviewRequests': [], 'createdAt': '2023-01-01T00:00:00Z'},
            {'number': 2, 'title': 'Assigned PR 1', 'author': {'login': 'anotheruser'}, 'url': 'http://example.com', 'reviewRequests': [{'login': 'testuser'}], 'createdAt': '2023-01-01T00:00:00Z'},
            {'number': 3, 'title': 'Label PR 3', 'author': {'login': 'anotheruser'}, 'url': 'http://example.com', 'reviewRequests': [{'login': 'anotheruser'}], 'createdAt': '2023-01-01T00:00:00Z'}
        ]
        prs_by_author = [
            {'number': 1, 'title': 'Author PR 1', 'author': {'login': 'testuser'}, 'url': 'http://example.com', 'reviewRequests': [], 'createdAt': '2023-01-01T00:00:00Z'}
        ]
        prs_assigned_to_user = [
            {'number': 2, 'title': 'Assigned PR 1', 'author': {'login': 'anotheruser'}, 'url': 'http://example.com', 'reviewRequests': [{'login': 'testuser'}], 'createdAt': '2023-01-01T00:00:00Z'}
        ]
        prs_assigned_to_teams = [
            {'number': 6, 'title': 'Team PR 1', 'author': {'login': 'anotheruser'}, 'url': 'http://example.com', 'reviewRequests': [{'login': 'teamuser'}], 'createdAt': '2023-01-01T00:00:00Z'}
        ]

        combined_prs =  prs_by_label + prs_assigned_to_teams
        filtered_combined_prs = filter_out_prs(combined_prs, prs_by_author + prs_assigned_to_user)
        self.assertEqual(len(filtered_combined_prs), 2)
        self.assertEqual(filtered_combined_prs[0]['number'], 3)

if __name__ == '__main__':
    unittest.main()
