"""Map emotions to emoji suggestions"""

from typing import List, Dict
import config

def emotions_to_emojis(emotion_scores: List[Dict], top_k: int = 3) -> List[str]:
    """
    Convert emotion predictions to emoji suggestions

    Args:
        emotion_scores: List of emotion predictions with scores
        top_k: Number of top emojis to return

    Returns:
        List of emoji strings
    """
    emoji_candidates = []

    # Get top emotions
    top_emotions = emotion_scores[:5]  # Consider top 5 emotions

    for emotion_data in top_emotions:
        emotion = emotion_data['emotion'].lower()
        score = emotion_data['score']

        # Map emotion to emojis
        if emotion in config.EMOTION_TO_EMOJI:
            emojis = config.EMOTION_TO_EMOJI[emotion]

            # Weight emojis by emotion score
            for emoji in emojis:
                emoji_candidates.append({
                    'emoji': emoji,
                    'weight': score,
                    'emotion': emotion
                })

    # If no matches, add some default neutral emojis
    if not emoji_candidates:
        return ['😐', '😶', '🤔']

    # Sort by weight and remove duplicates
    seen_emojis = set()
    unique_candidates = []

    for candidate in sorted(emoji_candidates, key=lambda x: x['weight'], reverse=True):
        if candidate['emoji'] not in seen_emojis:
            seen_emojis.add(candidate['emoji'])
            unique_candidates.append(candidate)

    # Return top K emojis
    return [c['emoji'] for c in unique_candidates[:top_k]]

def get_all_emojis() -> List[str]:
    """Get all available emojis"""
    all_emojis = []
    for emojis in config.EMOTION_TO_EMOJI.values():
        all_emojis.extend(emojis)
    return list(set(all_emojis))

def get_emojis_by_category() -> Dict[str, List[str]]:
    """Get emojis grouped by category for frontend"""
    return {
        'great': ['😊', '😄', '🥰', '😁', '🤗', '💚', '😍', '🌟'],
        'good': ['🙂', '😌', '😇', '🤓', '💛', '😎', '👍'],
        'okay': ['😐', '😑', '🤔', '😶', '💙', '😏', '🙃'],
        'low': ['😔', '😞', '😕', '😟', '🧡', '😐', '😥'],
        'terrible': ['😢', '😭', '😰', '😨', '💔', '😖', '😩', '😱'],
    }
