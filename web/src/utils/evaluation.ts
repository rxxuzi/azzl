import { API_ENDPOINT } from "../App";

interface EvaluationData {
  q: string;
  a: string;
  t: string;
  i: string;
  m: string;
  mode: string;
}

export async function submitEvaluation(type: 'good' | 'bad', data: EvaluationData): Promise<boolean> {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/eval/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error(`Failed to submit ${type} evaluation:`, error);
    return false;
  }
}