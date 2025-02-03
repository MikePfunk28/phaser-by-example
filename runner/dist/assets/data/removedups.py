import json
import hashlib


def find_duplicates(json_file_path):
    """
    Find duplicate questions in a JSON file by comparing question text hashes.

    Args:
        json_file_path (str): Path to JSON file containing questions

    Returns:
        dict: Dictionary mapping question hashes to original and duplicate indices
    """
    # Dictionary to store question hashes and their first occurrence index
    question_hashes = {}
    # Dictionary to store duplicate questions and their occurrences
    duplicate_map = {}

    # Read JSON file
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {json_file_path} not found")
        return {}
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {json_file_path}")
        return {}
    except Exception as e:
        print(f"Unexpected error reading file: {str(e)}")
        return {}

    # Process each question
    for idx, item in enumerate(questions):
        # Create hash of the question text
        question_text = item['question']
        question_hash = hashlib.sha256(question_text.encode()).hexdigest()

        # If we've seen this hash before, it's a duplicate
        if question_hash in question_hashes:

            original_idx = question_hashes[question_hash]
            if question_hash not in duplicate_map:
                duplicate_map[question_hash] = {
                    'original': original_idx,
                    'duplicates': []
                }
            duplicate_map[question_hash]['duplicates'].append(idx)
        else:
            question_hashes[question_hash] = idx

    # Print results
    print(f"Found {len(duplicate_map)} questions with duplicates:")
    for _, info in duplicate_map.items():
        original_q = questions[info['original']]['question']
        print(f"\nOriginal (index {info['original']}):")
        print(f"  {original_q[:100]}...")
        print("Duplicate indices:", info['duplicates'])

    return duplicate_map


def remove_duplicates(json_file_path, output_file_path):
    with open(json_file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Keep track of seen questions
    seen_hashes = set()
    unique_questions = []

    for question in questions:
        question_hash = hashlib.sha256(
            question['question'].encode()).hexdigest()
        if question_hash not in seen_hashes:
            seen_hashes.add(question_hash)
            unique_questions.append(question)

    # Write unique questions to new file
    with open(output_file_path, 'w', encoding='utf-8') as f:
        json.dump(unique_questions, f, indent=4)

    print(f"Original count: {len(questions)}")
    print(f"After removing duplicates: {len(unique_questions)}")
# import hashlib


def main():
    json_file_path = 'public/assets/data/questions.json'
    # output_file_path = 'public/assets/data/questions_unique.json'

    # First show duplicates
    find_duplicates(json_file_path)

    # Remove duplicates and create new file
    # remove_duplicates(json_file_path, output_file_path)


if __name__ == '__main__':
    main()
