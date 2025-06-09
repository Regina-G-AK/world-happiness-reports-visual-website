from flask import Flask, render_template, jsonify, send_file
import pandas as pd
import os

app = Flask(__name__)

# Function to load and process CSV data
def load_data():
    years = [str(year) for year in range(2015, 2025)]
    data = {}
    numeric_columns = [
        'Happiness Score', 'Standard Error', 'Upper Confidence Interval', 'Lower Confidence Interval',
        'Economy (GDP per Capita)', 'Family', 'Social support', 'Health (Life Expectancy)',
        'Freedom', 'Generosity', 'Trust (Government Corruption)', 'Dystopia Residual',
        'Dystopia + residual', 'Happiness Score in Dystopia', 'Ladder score in Dystopia'
    ]
    
    for year in years:
        try:
            file_path = f'world happiness reports 2015-2024/{year}.csv'
            if os.path.exists(file_path):
                df = pd.read_csv(file_path, encoding='utf-8')
                # Clean and convert numeric columns
                for col in numeric_columns:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                # Ensure Country_Chinese exists
                if 'Country_Chinese' not in df.columns:
                    df['Country_Chinese'] = df['Country'].fillna('未知')
                data[year] = df.to_dict(orient='records')
            else:
                print(f"File not found: {file_path}")
        except Exception as e:
            print(f"Error loading {year}: {e}")
    
    return data

# Route for the main page
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analysis')
def analysis():
    return render_template('analysis.html')

@app.route('/correlation')
def correlation():
    return render_template('correlation.html')

# Route to serve data for a specific year
@app.route('/data/<year>')
def get_data(year):
    data = load_data()
    if year in data:
        # Prepare data for visualizations
        year_data = data[year]
        top_countries = year_data[:5]
        bottom_countries = year_data[-5:][::-1]
        # Trend data for top 10 countries
        trend_countries = year_data[:10]
        trend_data = []
        for country in trend_countries:
            country_trend = {'name': country['Country_Chinese']}
            for y in data:
                country_data = next((d for d in data[y] if d['Country_Chinese'] == country['Country_Chinese']), None)
                country_trend[y] = country_data['Happiness Score'] if country_data else 0
            trend_data.append(country_trend)
        return jsonify({
            'year_data': year_data,
            'top_countries': top_countries,
            'bottom_countries': bottom_countries,
            'trend_data': trend_data
        })
    return jsonify({'error': 'Year not found'}), 404

@app.route('/data/<year>.csv')
def get_data_csv(year):
    data_path = os.path.join('world happiness reports 2015-2024', f'{year}.csv')
    return send_file(data_path, mimetype='text/csv')

if __name__ == '__main__':
    app.run(debug=True)