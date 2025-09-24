import requests
import json
import time
from textblob import TextBlob
import subprocess
import os
from datetime import datetime

class SentimentOracle:
    def __init__(self, contract_address):
        self.contract_address = contract_address
        self.reddit_posts = []
        self.twitter_posts = []
        self.sentiment_history = self.load_history()
        self.blended_history = []

    # ---------------- Fetch Data ----------------
    def fetch_reddit_data(self, subreddit="cryptocurrency", limit=25):
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
            headers = {'User-Agent': 'SentimentBot/1.0'}
            response = requests.get(url, headers=headers)
            data = response.json()
            
            posts = []
            for post in data['data']['children']:
                post_data = post['data']
                posts.append({
                    'text': post_data['title'] + ' ' + post_data.get('selftext', ''),
                    'score': post_data['score'],
                    'created': post_data['created_utc'],
                    'comments': post_data['num_comments']
                })
            
            self.reddit_posts = posts
            print(f"✅ Fetched {len(posts)} Reddit posts")
            return posts
        except Exception as e:
            print(f"❌ Reddit fetch error: {e}")
            return []

    def fetch_crypto_news(self):
        try:
            url = "https://api.coingecko.com/api/v3/news"
            response = requests.get(url)
            data = response.json()
            
            news_posts = []
            for item in data.get('data', [])[:20]:
                news_posts.append({
                    'text': item['title'] + ' ' + item.get('description', ''),
                    'score': 1,
                    'source': item.get('news_site', 'unknown')
                })
            print(f"✅ Fetched {len(news_posts)} crypto news items")
            return news_posts
        except Exception as e:
            print(f"❌ News fetch error: {e}")
            return []

    # ---------------- Sentiment Analysis ----------------
    def analyze_sentiment(self, texts):
        if not texts:
            return 50
        total_sentiment = 0
        total_weight = 0
        for item in texts:
            text = item['text']
            weight = item.get('score', 1)
            if len(text) < 10:
                continue
            blob = TextBlob(text)
            sentiment = blob.sentiment.polarity
            weighted_sentiment = sentiment * max(1, weight)
            total_sentiment += weighted_sentiment
            total_weight += max(1, weight)
        if total_weight == 0:
            return 50
        avg_sentiment = total_sentiment / total_weight
        sentiment_score = int((avg_sentiment + 1) * 50)
        return max(0, min(100, sentiment_score))

    # ---------------- Trend Calculation ----------------
    def calculate_trend(self, current_score):
        self.sentiment_history.append(current_score)
        # Keep last 20 scores for trend calculation
        if len(self.sentiment_history) > 20:
            self.sentiment_history = self.sentiment_history[-20:]
        # Compare recent 3 vs previous 3
        if len(self.sentiment_history) < 6:
            return 1  # stable
        recent_avg = sum(self.sentiment_history[-3:]) / 3
        older_avg = sum(self.sentiment_history[-6:-3]) / 3
        if recent_avg > older_avg + 5:
            return 2  # trending up
        elif recent_avg < older_avg - 5:
            return 0  # trending down
        else:
            return 1  # stable

    # ---------------- Smart Contract Update ----------------
    def update_smart_contract(self, sentiment_score, trend, volume):
        try:
            cmd = [
                "aptos", "move", "run",
                "--function-id", f"{self.contract_address}::emotion_signals::update_sentiment",
                "--args", f"u8:{sentiment_score}", f"u8:{trend}", f"u64:{volume}",
                "--assume-yes",
                "--profile", "default"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Contract updated: sentiment={sentiment_score}, trend={trend}, volume={volume}")
                return True
            else:
                print(f"❌ Contract update failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Contract update error: {e}")
            return False

    # ---------------- Fear & Greed Index ----------------
    def get_market_fear_greed_index(self):
        try:
            url = "https://api.alternative.me/fng/"
            response = requests.get(url)
            data = response.json()
            if data['data']:
                return int(data['data'][0]['value'])
            return 50
        except:
            return 50

    # ---------------- Persistence ----------------
    def save_history(self):
        try:
            with open("sentiment_history.json", "w") as f:
                json.dump(self.sentiment_history, f)
        except Exception as e:
            print(f"❌ Error saving history: {e}")

    def load_history(self):
        if os.path.exists("sentiment_history.json"):
            try:
                with open("sentiment_history.json") as f:
                    return json.load(f)
            except:
                return []
        return []

    # ---------------- Run One Cycle ----------------
    def run_analysis_cycle(self):
        print(f"\n🔄 Starting analysis cycle at {datetime.now()}")
        reddit_data = self.fetch_reddit_data()
        news_data = self.fetch_crypto_news()
        all_texts = reddit_data + news_data
        if not all_texts:
            print("❌ No data fetched, skipping cycle")
            return

        sentiment_score = self.analyze_sentiment(all_texts)
        volume = min(len(all_texts), 500)  # Cap volume
        trend = self.calculate_trend(sentiment_score)
        fg_index = self.get_market_fear_greed_index()

        blended_score = int((sentiment_score * 0.7) + (fg_index * 0.3))
        self.blended_history.append(blended_score)

        print(f"📊 Analysis Results:")
        print(f"   Social Sentiment: {sentiment_score}/100")
        print(f"   Fear & Greed Index: {fg_index}/100")
        print(f"   Volume: {volume} posts")
        print(f"   Trend: {['Down','Stable','Up'][trend]}")
        print(f"🎯 Final Blended Score: {blended_score}/100")

        self.update_smart_contract(blended_score, trend, volume)
        self.save_history()

        # Log results
        with open("oracle.log", "a") as f:
            f.write(f"{datetime.now()}: Sentiment={sentiment_score}, Trend={trend}, Blended={blended_score}, Volume={volume}\n")

# ---------------- Main Loop ----------------
def main():
    CONTRACT_ADDRESS = "0x473558faf73c5911531b6514abd4aeb12f6ebc3846a845a9d752fd6884ed65ec"
    oracle = SentimentOracle(CONTRACT_ADDRESS)

    print("🚀 Sentiment Oracle starting...")
    print("Press Ctrl+C to stop")

    try:
        while True:
            oracle.run_analysis_cycle()
            print("😴 Sleeping for 5 minutes...\n")
            time.sleep(300)
    except KeyboardInterrupt:
        print("\n👋 Sentiment Oracle stopped")

if __name__ == "__main__":
    main()
