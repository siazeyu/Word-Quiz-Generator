package com.wordquiz.ui.unit

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.wordquiz.R
import com.wordquiz.WordQuizApp
import com.wordquiz.data.model.Unit
import com.wordquiz.databinding.FragmentUnitListBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class UnitListFragment : Fragment() {
    private var _binding: FragmentUnitListBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: UnitAdapter
    private var textbookId: Long = 0
    private var textbookName: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentUnitListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        textbookId = arguments?.getLong("textbookId") ?: 0
        textbookName = arguments?.getString("textbookName") ?: ""

        setupRecyclerView()
        setupFab()
        observeUnits()
    }

    private fun setupRecyclerView() {
        adapter = UnitAdapter(
            onItemClick = { unit ->
                val bundle = bundleOf(
                    "unitId" to unit.id,
                    "unitName" to unit.name
                )
                findNavController().navigate(R.id.action_units_to_words, bundle)
            },
            onItemLongClick = { unit ->
                showEditDeleteDialog(unit)
            }
        )
        binding.rvUnits.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUnits.adapter = adapter
    }

    private fun setupFab() {
        binding.fabAdd.setOnClickListener {
            showAddDialog()
        }
    }

    private fun observeUnits() {
        val app = requireActivity().application as WordQuizApp
        lifecycleScope.launch {
            app.unitRepository.getUnitsByTextbookId(textbookId).collectLatest { units ->
                adapter.submitList(units)
                binding.tvEmpty.visibility = if (units.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    private fun showAddDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_unit, null)
        val etName = dialogView.findViewById<EditText>(R.id.et_name)

        AlertDialog.Builder(requireContext())
            .setTitle(R.string.add_unit)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val name = etName.text.toString().trim()
                if (name.isNotEmpty()) {
                    val unit = Unit(
                        textbookId = textbookId,
                        name = name
                    )
                    lifecycleScope.launch {
                        val app = requireActivity().application as WordQuizApp
                        app.unitRepository.insertUnit(unit)
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showEditDeleteDialog(unit: Unit) {
        AlertDialog.Builder(requireContext())
            .setTitle(unit.name)
            .setItems(arrayOf("编辑", "删除")) { _, which ->
                when (which) {
                    0 -> showEditDialog(unit)
                    1 -> showDeleteConfirmDialog(unit)
                }
            }
            .show()
    }

    private fun showEditDialog(unit: Unit) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_unit, null)
        val etName = dialogView.findViewById<EditText>(R.id.et_name)
        etName.setText(unit.name)

        AlertDialog.Builder(requireContext())
            .setTitle(R.string.edit_unit)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val name = etName.text.toString().trim()
                if (name.isNotEmpty()) {
                    val updated = unit.copy(
                        name = name,
                        updatedAt = System.currentTimeMillis()
                    )
                    lifecycleScope.launch {
                        val app = requireActivity().application as WordQuizApp
                        app.unitRepository.updateUnit(updated)
                    }
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showDeleteConfirmDialog(unit: Unit) {
        AlertDialog.Builder(requireContext())
            .setTitle(R.string.confirm_delete)
            .setMessage(R.string.confirm_delete_message)
            .setPositiveButton(R.string.delete) { _, _ ->
                lifecycleScope.launch {
                    val app = requireActivity().application as WordQuizApp
                    app.unitRepository.deleteUnit(unit)
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
