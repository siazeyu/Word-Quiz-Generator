package com.wordquiz.ui.textbook

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wordquiz.data.model.Textbook
import com.wordquiz.databinding.ItemTextbookBinding

class TextbookAdapter(
    private val onItemClick: (Textbook) -> Unit,
    private val onItemLongClick: (Textbook) -> Unit
) : ListAdapter<Textbook, TextbookAdapter.TextbookViewHolder>(TextbookDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TextbookViewHolder {
        val binding = ItemTextbookBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TextbookViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TextbookViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class TextbookViewHolder(
        private val binding: ItemTextbookBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(textbook: Textbook) {
            binding.tvName.text = textbook.name
            binding.tvDescription.text = textbook.description ?: ""

            binding.root.setOnClickListener { onItemClick(textbook) }
            binding.root.setOnLongClickListener {
                onItemLongClick(textbook)
                true
            }
        }
    }

    class TextbookDiffCallback : DiffUtil.ItemCallback<Textbook>() {
        override fun areItemsTheSame(oldItem: Textbook, newItem: Textbook): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Textbook, newItem: Textbook): Boolean {
            return oldItem == newItem
        }
    }
}
