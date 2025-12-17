import json
from collections import defaultdict

def load_preferences(big_file, little_file):
    with open(big_file, "r") as f:
        big_prefs = json.load(f)
    with open(little_file, "r") as f:
        little_prefs = json.load(f)
    return big_prefs, little_prefs


def make_rank_map(preferences):
    return {p: {other: i+1 for i, other in enumerate(lst)} for p, lst in preferences.items()}


def best_mutual_choice(person, their_prefs, other_ranks, matched_set):
    """
    Find this person's highest-ranked option who also ranked them back.
    If none found, return their highest-ranked available option.
    """
    for other in their_prefs.get(person, []):
        if other not in matched_set:
            if person in other_ranks.get(other, {}):
                return other
    for other in their_prefs.get(person, []):
        if other not in matched_set:
            return other
    return None


def match_bigs_littles(big_prefs, little_prefs):
    big_ranks = make_rank_map(big_prefs)
    little_ranks = make_rank_map(little_prefs)

    matches = defaultdict(list)
    matched_bigs = set()
    matched_littles = set()

    all_bigs = set(big_prefs.keys()) | {b for prefs in little_prefs.values() for b in prefs}
    all_littles = set(little_prefs.keys()) | {l for prefs in big_prefs.values() for l in prefs}

    max_rank = max(
        max((len(v) for v in big_prefs.values()), default=0),
        max((len(v) for v in little_prefs.values()), default=0)
    )

    order = []
    order.append((1, 1, 'exact'))  #1 to 1 matches first
    order.append((1, 2, 'big'))     # big priority: big ranked 1, little ranked 2
    order.append((2, 1, 'little'))  # little priority: little ranked 1, big ranked 2
    for n in range(2, max_rank + 1):
        if n + 1 <= max_rank:
            order.append((n, n + 1, 'big'))  # then 2-3, 3-4, ... with big priority

    # Apply priority passes
    for rank_big, rank_little, kind in order:
        for big in sorted(all_bigs):
            if big in matched_bigs:
                continue
            big_list = big_prefs.get(big, [])
            if len(big_list) < rank_big:
                continue
            little = big_list[rank_big - 1]
            if little in matched_littles:
                continue
            little_rank = little_ranks.get(little, {}).get(big)
            if little_rank == rank_little:
                matches[big].append(little)
                matched_bigs.add(big)
                matched_littles.add(little)

    # Second pass: match remaining bigs using mutual preference if possible
    remaining_bigs = [b for b in sorted(all_bigs) if b not in matched_bigs]
    for big in remaining_bigs:
        choice = best_mutual_choice(big, big_prefs, little_ranks, matched_littles)
        if choice:
            matches[big].append(choice)
            matched_bigs.add(big)
            matched_littles.add(choice)

    # Third pass: match remaining littles using mutual preference if possible
    remaining_littles = [l for l in sorted(all_littles) if l not in matched_littles]
    for little in remaining_littles:
        choice = best_mutual_choice(little, little_prefs, big_ranks, matched_bigs)
        if choice:
            matches[choice].append(little)
            matched_bigs.add(choice)
            matched_littles.add(little)

    # Final deterministic fallback
    remaining_bigs = [b for b in sorted(all_bigs) if b not in matched_bigs]
    remaining_littles = [l for l in sorted(all_littles) if l not in matched_littles]
    for big, little in zip(remaining_bigs, remaining_littles):
        matches[big].append(little)
        matched_bigs.add(big)
        matched_littles.add(little)

    # ---- Handle imbalance (extras get a 2nd match, but max 2 per person) ----
    num_bigs = len(all_bigs)
    num_littles = len(all_littles)

    def little_load(little):
        return sum(little in v for v in matches.values())

    if num_littles > num_bigs:
        # More littles → some bigs get 2 littles
        extras = [l for l in all_littles if l not in matched_littles]
        for little in extras:
            candidates = [b for b in all_bigs if len(matches[b]) < 2]
            if not candidates:
                break
            # Try to use mutual preference
            mutuals = [b for b in candidates if little in big_prefs.get(b, [])]
            if mutuals:
                candidates = mutuals
            candidates.sort(key=lambda b: little_ranks.get(little, {}).get(b, float('inf')))
            chosen_big = candidates[0]
            matches[chosen_big].append(little)
            matched_littles.add(little)

    elif num_bigs > num_littles:
        # More bigs → some littles get 2 bigs
        extras = [b for b in all_bigs if b not in matched_bigs]
        for big in extras:
            candidates = [l for l in all_littles if little_load(l) < 2]
            if not candidates:
                break
            # Try to use mutual preference
            mutuals = [l for l in candidates if big in little_prefs.get(l, [])]
            if mutuals:
                candidates = mutuals
            candidates.sort(key=lambda l: big_ranks.get(big, {}).get(l, float('inf')))
            chosen_little = candidates[0]
            matches[big].append(chosen_little)
            matched_bigs.add(big)

    return matches


if __name__ == "__main__":
    big_prefs, little_prefs = load_preferences("bigs.json", "littles.json")
    matches = match_bigs_littles(big_prefs, little_prefs)

    print("Final Matches:")
    for big, littles in matches.items():
        if len(littles) == 1:
            print(f"{big} ❤️ {littles[0]}")
        else:
            print(f"{big} ❤️ {', '.join(littles)}")
