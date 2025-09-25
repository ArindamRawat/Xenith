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
        self.market_posts = []
        self.sentiment_history = self.load_history()
        self.blended_history = []

    # ---------------- Fetch Reddit Data ----------------
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

    # ---------------- Fetch CoinGecko Market Data ----------------
    def fetch_crypto_market_sentiment(self, coins=["bitcoin", "ethereum"]):
        try:
            url = f"https://api.coingecko.com/api/v3/coins/markets"
            params = {
                "vs_currency": "usd",
                "ids": ",".join(coins),
                "order": "market_cap_desc",
                "per_page": len(coins),
                "page": 1,
                "price_change_percentage": "24h"
            }
            response = requests.get(url, params=params)
            data = response.json()

            posts = []
            for item in data:
                change = item.get("price_change_percentage_24h", 0)
                # Convert price change to a sentiment score 0-100
                sentiment_score = max(0, min(100, int(50 + change)))
                posts.append({
                    "text": f"{item['name']} price change: {change:.2f}%",
                    "score": sentiment_score
                })
            self.market_posts = posts
            print(f"✅ Fetched {len(posts)} market sentiment items from CoinGecko")
            return posts
        except Exception as e:
            print(f"❌ Market fetch error: {e}")
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
            if len(text) < 5:
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
        if len(self.sentiment_history) > 20:
            self.sentiment_history = self.sentiment_history[-20:]
        if len(self.sentiment_history) < 6:
            return 1  # stable
        recent_avg = sum(self.sentiment_history[-3:]) / 3
        older_avg = sum(self.sentiment_history[-6:-3]) / 3
        if recent_avg > older_avg + 5:
            return 2  # up
        elif recent_avg < older_avg - 5:
            return 0  # down
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

    # ---------------- Run One Analysis Cycle ----------------
    def run_analysis_cycle(self):
        print(f"\n🔄 Starting analysis cycle at {datetime.now()}")
        reddit_data = self.fetch_reddit_data()
        market_data = self.fetch_crypto_market_sentiment()
        all_texts = reddit_data + market_data
        if not all_texts:
            print("❌ No data fetched, skipping cycle")
            return

        sentiment_score = self.analyze_sentiment(all_texts)
        volume = min(len(all_texts), 500)
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
