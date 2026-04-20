package com.wordquiz.ui.dictation

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.wordquiz.R
import com.wordquiz.data.model.DictationItem

class DictationItemAdapter(
    private val items: MutableList<DictationItem>
) : RecyclerView.Adapter<DictationItemAdapter.DictationItemViewHolder>() {

    private val revealedItems = mutableSetOf<Int>()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DictationItemViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_dictation, parent, false)
        return DictationItemViewHolder(view)
    }

    override fun onBindViewHolder(holder: DictationItemViewHolder, position: Int) {
        val item = items[position]
        holder.bind(item, position)
    }

    override fun getItemCount(): Int = items.size

    inner class DictationItemViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvPrompt: TextView = itemView.findViewById(R.id.tv_prompt)
        private val tvAnswer: TextView = itemView.findViewById(R.id.tv_answer)
        private val tvPhonetic: TextView = itemView.findViewById(R.id.tv_phonetic)
        private val tvShowAnswer: TextView = itemView.findViewById(R.id.tv_show_answer)

        fun bind(item: DictationItem, position: Int) {
            tvPrompt.text = "${position + 1}. ${item.prompt}"
            tvAnswer.text = item.answer
            tvPhonetic.text = item.phonetic ?: ""
            tvPhonetic.visibility = if (item.phonetic.isNullOrEmpty()) View.GONE else View.VISIBLE

            if (revealedItems.contains(position)) {
                tvAnswer.visibility = View.VISIBLE
                tvShowAnswer.visibility = View.GONE
            } else {
                tvAnswer.visibility = View.GONE
                tvShowAnswer.visibility = View.VISIBLE
            }

            tvShowAnswer.setOnClickListener {
                revealedItems.add(position)
                tvAnswer.visibility = View.VISIBLE
                tvShowAnswer.visibility = View.GONE
            }
        }
    }
}
