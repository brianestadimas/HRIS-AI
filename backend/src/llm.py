

from flask import jsonify
from src.constants import ddl_statement, generate_sql_prompt, generate_sql_update_prompt
import sqlparse

class PurpleGPT():
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer

    def generate_sql(user_question):
        if not user_question:
            return jsonify({"error": "Question parameter is required"}), 400

        prompt = generate_sql_prompt

        input_text = prompt.format(user_question=user_question, ddl_statement=ddl_statement)
        input_ids = self.tokenizer(input_text, return_tensors="pt").to(self.model.device)
        
        generated_ids = self.model.generate(
            **input_ids,
            num_return_sequences=1,
            eos_token_id=self.tokenizer.eos_token_id,
            pad_token_id=self.tokenizer.eos_token_id,
            max_new_tokens=1000,
            do_sample=False,
        )
        
        outputs = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
        out = sqlparse.format(outputs[0].split("```sql")[-1], reindent=True)
        
        # Preprocess if there is update statement
        second_prompt = generate_sql_update_prompt

        if "UPDATE" in out:
            input_text = second_prompt.format(user_question=user_question, ddl_statement=ddl_statement)
            input_ids = self.tokenizer(input_text, return_tensors="pt").to(self.model.device)
            
            generated_ids = self.model.generate(
                **input_ids,
                num_return_sequences=1,
                eos_token_id=self.tokenizer.eos_token_id,
                pad_token_id=self.tokenizer.eos_token_id,
                max_new_tokens=1000,
                do_sample=False,
            )
            
            outputs = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
            out = sqlparse.format(outputs[0].split("```sql")[-1], reindent=True)
        
        return {"response": out, "is_update": "UPDATE" in out}


def remove_alias_from_sql(sql_query):
    if 'UPDATE ' in sql_query and ' SET ' in sql_query:
        parts = sql_query.split(' ')
        update_index = parts.index('UPDATE')
        set_index = parts.index('SET')
        
        # Extract table name and alias
        table_with_alias = parts[update_index + 1]
        table_name, alias = table_with_alias.split()
        
        # Reconstruct the SQL without alias
        sql_query_no_alias = f"UPDATE {table_name} "
        
        # Add parts before SET clause
        for i in range(set_index, len(parts)):
            sql_query_no_alias += parts[i].replace(f'{alias}.', f'{table_name}.').replace(f' {alias}', '')
        
        # Remove redundant table names in SET clause
        sql_query_no_alias = sql_query_no_alias.replace(f"{table_name}.{table_name}.", f"{table_name}.")
        
        return sql_query_no_alias

    return sql_query